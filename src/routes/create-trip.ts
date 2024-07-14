import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import nodemailer from "nodemailer"
import { error } from "console";
import { getMailClient } from "../lib/mail";
import {dayjs} from "../lib/dayjs";
import {prisma} from "../lib/prisma"
import { ClientError } from "../errors/client-error";

export async function createTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post("/trips", {
       schema:  {
        body: z.object({
            destination: z.string().min(4),
            starts_at: z.coerce.date(),
            ends_at: z.coerce.date(),
            owner_name: z.string(),
            owner_email: z.string().email(),
            emails_to_invite: z.array(z.string().email()),
        })
       }
    }, async (request)=>{
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite} = request.body

        if(dayjs(starts_at).isBefore(new Date())){
            throw new ClientError("Invalid trip start date")
        }

        if(dayjs(ends_at).isBefore(starts_at)){
            throw new ClientError("Invalid trip end date")
        }


        const trip = await prisma.trip.create({
            data: {
                destination,
                starts_at,
                ends_at,
            }
        })


        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: "Equipe plann.er",
                address: "oi@plann.er"
            },
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: "Testando envio de email",
            html: "<p>Teste do envio de email</p>"
        })

        console.log(nodemailer.getTestMessageUrl(message))


        return {
            tripId : trip.id
        }
    })
}