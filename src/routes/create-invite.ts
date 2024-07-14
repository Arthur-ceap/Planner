import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import nodemailer from "nodemailer"
import { error } from "console";
import { getMailClient } from "../lib/mail";
import {dayjs} from "../lib/dayjs";
import {prisma} from "../lib/prisma"
import { ClientError } from "../errors/client-error";

export async function createInvite(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post("/trips/:tripId/invites", {
       schema:  {
        params: z.object({
            tripId: z.string().uuid(),
        }),
        body: z.object({
            email: z.string().email()
        })
       }
    }, async (request)=>{
        const {tripId} = request.params
        const { email} = request.body

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            }
        })

        if(!trip){
            throw new ClientError("Trip not found")
        }

        const participant = await prisma.participant.create({
            data:{
                email,
                trip_Id: tripId
            }
        })

        return {
            participantId: participant.id
        }
    })
}