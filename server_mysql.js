require('dotenv').config()

const express = require('express')
const bp = require('body-parser')
const morgan = require('morgan')
const { databaseService } = require('./databaseService')

const app = express()
const dbService = databaseService()

app.use(bp.urlencoded({ extended: true }))
app.use(bp.json())
app.use(morgan('dev'))

// ROUTES

app.get('/login', (req, res) => {
  dbService.login(req.body)
    .then(estudiante => res.json(estudiante))
    .catch(e => res.status(500).send(e))
})

app.post('/estudiante', (req, res) => {
  dbService.postEstudiante(req.body)
    .then(() => res.json({ mensaje: "Estudiante creado." }))
    .catch(e => res.status(500).send(e))
})

app.get('/carreras', (req, res) => {
  dbService.getCarreras()
    .then(carreras => res.json(carreras))
    .catch(e => res.status(500).send(e))
})

app.post('/carreras', (req, res) => {
  dbService.postCarreras(req.body)
    .then(() => res.json({ mensaje: "Carrera creada." }))
    .catch(e => res.status(500).send(e))
})

app.listen(process.env.PORT, () => {
  console.log(`Server on http://localhost:${process.env.PORT}`)
})
