require('dotenv').config()

const express = require('express')
const bp = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const { databaseService } = require('./databaseService')

const app = express()
const dbService = databaseService()

app.use(cors())
app.use(bp.urlencoded({ extended: true }))
app.use(bp.json())
app.use(morgan('dev'))

// ROUTES

app.post('/login', (req, res) => {
  dbService.login(req.body)
    .then(estudiante => res.json(estudiante))
    .catch(e => res.status(500).send(e))
})

app.post('/estudiante', (req, res) => {
  dbService.postEstudiante(req.body)
    .then(() => res.json({ mensaje: "Estudiante creado." }))
    .catch(e => res.status(500).send(e))
})

app.patch('/estudiante/:codigo', (req, res) => {
  dbService.patchEstudiante(req.body)
    .then(() => res.json({ mensaje: "Estudiante editado." }))
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

app.post('/programas', (req, res) => {
  dbService.postProgramas(req.body)
    .then(() => res.json({ mensaje: "Programa creado." }))
    .catch(e => res.status(500).send(e))
})

app.get('/programas/:tipo', (req, res) => {
  dbService.getProgramasporTipo(req.params)
    .then(programas => {
      resultado = []

      programas.forEach(p => {
        const programIndex = resultado.findIndex(el => el.id === p.id)

        if (programIndex !== -1) {
          const resultProgram = resultado[programIndex]
          resultProgram.carreras.push(p.clave_carrera)
          resultado[programIndex] = resultProgram
        }
        else {
          const { id, nombre, descripcion, telefono, correo, institucion, imagen, tipo, clave_carrera } = p
          resultado.push({
            id,
            nombre,
            descripcion,
            telefono,
            correo,
            institucion,
            imagen,
            tipo,
            carreras: clave_carrera ? [clave_carrera] : null
          })
        }
      })

      res.json(resultado)
    })
    .catch(e => res.status(500).send(e))
})

app.get('/programa/:tipo/:id', (req, res) => {
  dbService.getPrograma(req.params)
    .then(programa => {
      resultado = []

      programa.forEach(p => {
        const programIndex = resultado.findIndex(el => el.id === p.id)

        if (programIndex !== -1) {
          const resultProgram = resultado[programIndex]
          resultProgram.carreras.push(p.clave_carrera)
          resultado[programIndex] = resultProgram
        }
        else {
          const { id, nombre, descripcion, telefono, correo, institucion, imagen, tipo, clave_carrera } = p
          resultado.push({
            id,
            nombre,
            descripcion,
            telefono,
            correo,
            institucion,
            imagen,
            tipo,
            carreras: clave_carrera ? [clave_carrera] : null
          })
        }
      })

      res.json(resultado)
    })
    .catch(e => res.status(500).send(e))
})

app.listen(process.env.PORT, () => {
  console.log(`Server on http://localhost:${process.env.PORT}`)
})
