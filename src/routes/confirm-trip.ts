import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { request } from "http";
import {promise, z} from "zod"
import { prisma } from "../lib/prisma";
import {dayjs} from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";

export async function confirmTrip(app:FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/trips/:tripId/confirm',
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),
            },
        },
        async (request, reply) =>{
            const {tripId} = request.params

            const trip = await prisma.trip.findUnique({
                where: {
                    id: tripId
                }, 
                include: {
                    participants: {
                        where: {
                            is_owner: false
                        }
                    }
                }
            })

            if (!trip){
                throw new ClientError("Trip not found")
            }

            if (trip.is_confirmed){
                return reply.redirect(`http://localhost:3000/trips/${tripId}`)
            }

            await prisma.trip.update({
                where: {id: tripId},
                data: {is_confirmed: true }
            })

            

            const formattedStartDate = dayjs(trip.starts_at).format("LL")
            const formattedEndDate = dayjs(trip.ends_at).format("LL")

            const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm/ID_DO_PARTICIPANTE`

            const mail = await getMailClient()

            await Promise.all(
                trip.participants.map(async() => {
                    //const confirmationLink = `http://localhost:3333/participants/${trip.participants}/confirm`

                    
                    const message = await mail.sendMail({
                        from: {
                            name: "Equipe plann.er",
                            address: "oi@plann.er",
                        },
                        subject: `Confirme sua presença na viagem para ${trip.destination} on ${formattedStartDate}`,
                    })
                })
            )

            return reply.redirect(`http://localhost:3000/trips/${tripId}`)
        }
    )
}