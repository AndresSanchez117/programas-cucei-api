require('dotenv').config()

const express = require('express')
const bp = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const multer = require('multer')
const { databaseService } = require('./databaseService')
const s3Client = require('./s3Client')

const app = express()
const dbService = databaseService()

app.use(cors())
app.use(bp.urlencoded({ extended: true }))
app.use(bp.json())
app.use(morgan('dev'))

// only store image on memory
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// ROUTES

app.post('/login', (req, res) => {
  dbService.login(req.body)
    .then(async (estudiante) => {
      const imgKey = estudiante[0].foto
      const imgUrl = await s3Client.getImgURL(imgKey)

      estudiante[0].foto = imgUrl

      res.json(estudiante)
    })
    .catch(e => {
      if (e.name === 'TypeError') {
        res.status(401).send({ mensaje: "Datos incorrectos." })
      }
      else {
        res.status(500).send(e)
      }
    })
})

app.post('/loginAdministrador', (req, res) => {
  dbService.loginAdministrador(req.body)
    .then(async (administrador) => {
      const imgUrl = await s3Client.getImgURL('defaultAdmin.png')
      administrador[0].foto = imgUrl
      res.json(administrador)
    })
    .catch(e => {
      if (e.name === 'TypeError') {
        res.status(401).send({ mensaje: "Datos incorrectos." })
      }
      else {
        res.status(500).send(e)
      }
    })
})

app.post('/estudianteDatos', (req, res) => {
  dbService.postEstudianteDatos(req.body)
    .then(async (estudiante) => {
      const imgKey = estudiante[0].foto
      const imgUrl = await s3Client.getImgURL(imgKey)

      estudiante[0].foto = imgUrl

      res.json(estudiante)
    })
    .catch(e => res.status(500).send(e))
})

app.post('/estudiante', (req, res) => {
  dbService.postEstudiante(req.body)
    .then(() => res.json({ mensaje: "Estudiante creado." }))
    .catch(e => res.status(500).send(e))
})

app.post('/administrador', (req, res) => {
  dbService.postAdministrador(req.body)
    .then(() => res.json({ mensaje: "Administrador creado." }))
    .catch(e => res.status(500).send(e))
})

app.patch('/administrador', (req, res) => {
  dbService.patchAdministrador(req.body)
    .then(() => res.json({ mensaje: "Administrador editado." }))
    .catch(e => res.status(500).send(e))
})

app.patch('/estudiante', upload.single('foto'), async (req, res) => {
  // Si hay una foto en el request, subirla a S3
  if (req.file) {
    const codigoFinal = req.body.codigo ? req.body.codigo : req.body.codigoOri
    const imgKey = `${codigoFinal}/perfil`
    await s3Client.upload(req.file, imgKey)

    req.body.foto = imgKey
  }

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

// TODO: drop 'imagen' column from program table
app.post('/programas', upload.single('foto'), (req, res) => {
  dbService.postProgramas(req.body)
    .then(() => {
      dbService.getLastProgramID().then(async (ids) => {
        const programID = ids[0].id
        const imgKey = `programa/${programID}`
        await s3Client.upload(req.file, imgKey)

        res.json({ mensaje: "Programa creado." })
      })
    })
    .catch(e => res.status(500).send(e))
})

app.patch('/programas', upload.single('foto'), (req, res) => {
  // TODO
})

app.delete('/programas', (req, res) => {
  // TODO
})

app.get('/programas/:tipo', (req, res) => {
  dbService.getProgramasporTipo(req.params)
    .then(async programas => {
      let resultado = []

      for (let p of programas) {
        try {
          const programIndex = resultado.findIndex(el => el.id === p.id)

          if (programIndex !== -1) {
            const resultProgram = resultado[programIndex]
            resultProgram.carreras.push(p.clave_carrera)
            resultado[programIndex] = resultProgram
          }
          else {
            const { id, nombre, descripcion, telefono, correo, institucion, tipo, clave_carrera } = p
            const imagen = await s3Client.getImgURL(`programa/${id}`)
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
        } catch (error) {
          console.log('error' + error);
        }
      }

      res.json(resultado)
    })
    .catch(e => res.status(500).send(e))
})

app.get('/programa/:tipo/:id', (req, res) => {
  dbService.getPrograma(req.params)
    .then(async programa => {
      //console.log(programa)
      let resultado = []

      for (let p of programa) {
        try {
          const programIndex = resultado.findIndex(el => el.id === p.id)

          if (programIndex !== -1) {
            const resultProgram = resultado[programIndex]
            resultProgram.carreras.push(p.clave_carrera)
            resultado[programIndex] = resultProgram
          }
          else {
            const { id, nombre, descripcion, telefono, correo, institucion, tipo, clave_carrera } = p
            const imgKey = `programa/${id}`
            const imagen = await s3Client.getImgURL(imgKey)
            console.log(imagen)
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
        } catch (error) {
          console.log('error' + error);
        }
      }

      res.json(resultado)
    })
    .catch(e => res.status(500).send(e))
})

app.post('/guardarFavoritos', (req, res) => {
  // TODO
})

app.post('/obtenerFavoritos', (req, res) => {
  // TODO
})

app.delete('/eliminarFavoritos', (req, res) => {
  // TODO
})

app.post('/registro', (req, res) => {
  // TODO
})



app.listen(process.env.PORT, () => {
  console.log(`Server on http://localhost:${process.env.PORT}`)
})
