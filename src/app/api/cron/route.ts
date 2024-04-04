import { db } from "../../../firebase/firebase-admin-config";
import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";
//import axios from 'axios';
import { Resend } from "resend";

//const serviceId = process.env.EMAILJSSERVICEID as string
//const templateId = process.env.EMAILJSTEMPLATEID as string
//const userId = process.env.EMAILJSPUBLICKEY as string
const resend = new Resend(process.env.RESEND_API_KEY);

var clientes2 = [{}];
clientes2.shift();

function formatDate2(Ref: Date) {
  var d = new Date(Ref);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + 1);

    var month = "" + (d.getMonth() + 1);
    var day = "" + d.getDate();
    var year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [day, month, year].join("/");
  } else {
    return ["//"];
  }
}

export async function GET(req: Request) {
  let dados = [];
  const clientesRef = db.collection("usuario");
  const snapshot = await clientesRef.where("email", "!=", "").get();

  if (snapshot.empty) {
    return new Response(
      JSON.stringify({ message: "Nenhum cliente encontrado." }),
      { status: 200 }
    );
  }

  let usuarios = [];

  snapshot.forEach((doc) => {
    usuarios.push({
      email: doc.data().email,
      expira: doc.data().expira,
      assinatura: doc.data().assinatura,
      user: doc.data().user,
    });
  });

  for (const usuario of usuarios) {
    const { user, email } = usuario;
    let mail = email;
    try {
      const querySnapshot = await db
        .collection("usuario/" + user + "/clientes/")
        .get();
      let clientes = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const { dataprogressao, dataprogressao2, datacondicional } = data;
        const datar1 = new Date(dataprogressao);
        const datar2 = new Date(dataprogressao2);
        const datarc = new Date(datacondicional);
        const dataAtual = new Date();

        let d1 = differenceInDays(datar1, dataAtual);
        let d2 = differenceInDays(datar2, dataAtual);
        let d3 = differenceInDays(datarc, dataAtual);

        if (
          (d1 <= 60 && d1 >= 0) ||
          (d2 <= 60 && d2 >= 0) ||
          (d3 <= 60 && d3 >= 0)
        ) {
          clientes.push(data);
        }
      });

      let xmessage = "";
      clientes.forEach((cliente) => {
        xmessage +=
          `${cliente.nome} ${cliente.presidio} ${cliente.matricula} ${cliente.processo} ` +
          `1ª Progressão: ${formatDate2(cliente.dataprogressao)} ` +
          `2ª Progressão: ${formatDate2(cliente.dataprogressao2)} ` +
          `Condicional: ${formatDate2(cliente.datacondicional)} <br>`;
      });

      if (xmessage !== "") {
        await resend.emails.send({
          from: "execucaopenal@nacciadvocacia.com",
          to: mail,
          subject: "Relação de clientes com possível progressão de pena o LC",
          html:
            `Olá, ${mail}, <br> Seus clientes abaixo relacionados possivelmente estão com uma das seguintes datas com vencimento próximo de 60 dias ou menos verifique: PROGRESSÃO1, PROGRESSÃO2, CONDICIONAL:` +
            `<br> <p style="padding:12px;border-left:4px solid #d0d0d0;font-style:italic">${xmessage}</p>`,
        });
      }
    } catch (error) {
      console.error("Erro ao processar o usuário:", user, error);
    }
  }
  return new Response(JSON.stringify({ message: "Concluído com sucesso!" }), {
    status: 200,
  });
}
