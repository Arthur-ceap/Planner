import {date, z} from "zod"
import {prisma} from "../lib/prisma"
import dayjs  from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat"

dayjs.locale("pt-br")
dayjs.extend(localizedFormat)

export {dayjs}