import express from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma.js'
import { healthRoute } from './routes/health.js'
import { pasteRoutes } from './routes/pastes.js'
import { viewRoutes } from './routes/view.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

healthRoute(app)
pasteRoutes(app)
viewRoutes(app)

export { app, prisma }