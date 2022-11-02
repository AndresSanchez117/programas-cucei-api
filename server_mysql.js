require('dotenv').config()

const express = require('express')
const bp = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const multer = require('multer')
const { databaseService } = require('./databaseService')
const s3Client = require('./s3Client')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

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

app.post('/administradorDatos', (req, res) => {
  dbService.postAdministradorDatos(req.body)
    .then(async (administrador) => {
      const imgUrl = await s3Client.getImgURL('defaultAdmin.png')
      administrador[0].foto = imgUrl
      res.json(administrador)
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

// TODO: if codigo is changed, also edit programa_estudiante, y programa_guardado
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

app.patch('/programas', upload.single('foto'), async (req, res) => {
  if (req.file) {
    const imgKey = `programa/${req.body.id}`
    await s3Client.upload(req.file, imgKey)
  }

  dbService.patchProgramas(req.body)
    .then(() => res.json({ mensaje: "Programa editado." }))
    .catch(e => res.status(500).send(e))
})

app.delete('/programas', (req, res) => {
  dbService.deleteProgramas(req.body)
    .then(() => res.json({ mensaje: "Programa eliminado." }))
    .catch(e => res.status(500).send(e))
})

app.get('/programas', (req, res) => {
  dbService.getProgramas()
    .then(async programas => {
      // TODO: refactor in a function to get 'resultado' based on 'programas'
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

app.get('/programas/:tipo', (req, res) => {
  dbService.getProgramasporTipo(req.params)
    .then(async programas => {
      // TODO: refactor in a function to get 'resultado' based on 'programas'
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
  dbService.postGuardarFavoritos(req.body)
    .then(() => res.json({ mensaje: "Programa favorito guardado." }))
    .catch(e => res.status(500).send(e))
})

app.post('/obtenerFavoritos', (req, res) => {
  dbService.postObtenerFavoritos(req.body)
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

// TODO: drop 'estado' column from programa_guardado table
app.delete('/eliminarFavoritos', (req, res) => {
  dbService.deleteFavoritos(req.body)
    .then(() => res.json({ mensaje: "Programa favorito eliminado." }))
    .catch(e => res.status(500).send(e))
})

// TODO: check if error is for duplicate key and send appropiate error message to the client
app.post('/registro', (req, res) => {
  dbService.postRegistro(req.body)
    .then(infoRegistro => {

      // ? Change email provider to Amazon SES? 
      const institutionMailOptions = {
        from: process.env.EMAIL_USER,
        to: infoRegistro[0].correo,
        subject: 'Registro de estudiante a programa',
        html: `<h1>Nuevo registro en Programas CUCEI</h1>
        <p>Registro realizado a ${infoRegistro[0].nombre_programa}.</p>
        <p>El usuario registrado es ${infoRegistro[0].nombre_estudiante} ${infoRegistro[0].primer_apellido} ${infoRegistro[0].segundo_apellido}. Estudiante ${infoRegistro[0].estatus}/a de la carrera ${infoRegistro[0].clave_carrera}</p>
        <p>Para ponerse en contacto con el estudiante comuníquese a ${infoRegistro[0].correo_estudiante}.</p>
        <p>Saludos cordiales,</p>
        <p>Programas CUCEI.</p>`
      }

      transporter.sendMail(institutionMailOptions, (error, info) => {
        if (error) {
          console.log(error)
        } else {
          console.log('Email sent: ' + info.response);
        }
      })

      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: infoRegistro[0].correo_estudiante,
        subject: `Registro realizado a ${infoRegistro[0].nombre_programa}`,
        html: `<h1>Registro realizado</h1>
        <p>Saludos ${infoRegistro[0].nombre_estudiante}</p>
        <p>Se te informa que has realizado tu registro a ${infoRegistro[0].nombre_programa} ofrecido por ${infoRegistro[0].institucion}. La institución se pondrá pronto en contacto contigo una vez haya evaluado tu registro.</p>
        <p>Para más informción de este programa, o para explorar más programas sigue visitando Programas CUCEI.</p>
        <p>Gracias,</p>
        <p>Programas CUCEI.</p>`
      }

      transporter.sendMail(userMailOptions, (error, info) => {
        if (error) {
          console.log(error)
        } else {
          console.log('Email sent: ' + info.response);
        }
      })

      res.json({ mensaje: "Registrado exitosamente." })
    })
    .catch(e => res.status(500).send(e))
})



app.listen(process.env.PORT, () => {
  console.log(`Server on http://localhost:${process.env.PORT}`)
})
