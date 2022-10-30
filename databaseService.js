const databaseService = () => {
  const knex = require('knex')({
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB
    }
  })

  // TODO: Encrypt passwords
  // LOGIN
  const login = ({ correo_estudiante, contrasena }) => {
    return knex('Estudiante').where({
      correo_estudiante: correo_estudiante,
      contrasena: contrasena,
      estado: 0
    }).select()
  }

  const loginAdministrador = ({ correo, contrasena }) => {
    return knex('Administrador').where({
      correo,
      contrasena,
      estado: 0
    }).select()
  }

  // ESTUDIANTE

  const postEstudianteDatos = ({ codigo }) => {
    return knex('Estudiante').where({
      codigo,
      estado: 0
    }).select()
  }

  const postEstudiante = ({ codigo, nombre, primer_apellido, segundo_apellido, contrasena, clave_carrera, ciclo_escolar, num_semestre, estatus, correo_estudiante }) => {
    return knex('Estudiante').insert({
      codigo: codigo,
      nombre: nombre,
      primer_apellido: primer_apellido,
      segundo_apellido: segundo_apellido,
      contrasena: contrasena,
      clave_carrera: clave_carrera,
      ciclo_escolar: ciclo_escolar,
      num_semestre: num_semestre,
      estatus: estatus,
      correo_estudiante: correo_estudiante
    })
  }

  // TODO: if codigo update, change programa_estudiante and programa_guardado
  const patchEstudiante = ({ codigoOri, codigo, nombre, primer_apellido, segundo_apellido, contrasena, clave_carrera, ciclo_escolar, num_semestre, estatus, correo_estudiante, foto }) => {
    return knex('Estudiante')
      .where({
        'Estudiante.codigo': codigoOri
      })
      .update({
        codigo: codigo,
        nombre: nombre,
        primer_apellido: primer_apellido,
        segundo_apellido: segundo_apellido,
        contrasena: contrasena,
        clave_carrera: clave_carrera,
        ciclo_escolar: ciclo_escolar,
        num_semestre: num_semestre,
        estatus: estatus,
        correo_estudiante: correo_estudiante,
        foto
      })
  }

  // ADMINISTRADOR

  const postAdministrador = ({ nombre, primer_apellido, segundo_apellido, correo, contrasena }) => {
    return knex('Administrador').insert({
      nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      contrasena
    })
  }

  const patchAdministrador = ({ id, nombre, primer_apellido, segundo_apellido, correo, contrasena }) => {
    return knex('Administrador')
      .where({
        id
      })
      .update({
        nombre,
        primer_apellido,
        segundo_apellido,
        correo,
        contrasena
      })
  }

  // CARRERAS

  const getCarreras = () => {
    return knex('Carrera').where({
      estado: 0
    }).select('nombre', 'clave')
  }

  const postCarreras = ({ nombre, clave }) => {
    return knex('Carrera').insert({
      nombre: nombre,
      clave: clave
    })
  }

  // PROGRAMAS

  const postProgramas = ({ nombre, descripcion, telefono, correo, institucion, tipo, carreras }) => {
    return knex.transaction(trx => {
      return trx('Programa').insert({
        nombre,
        descripcion,
        telefono,
        correo,
        institucion,
        tipo
      }).then(ids => {
        let carrerasObj = []
        carreras.forEach(carrera => carrerasObj.push({ 'clave_carrera': carrera, 'id_programa': ids[0] }))
        return trx('Programa_carrera').insert(carrerasObj)
      })
    })
  }

  const patchProgramas = ({ id, nombre, descripcion, telefono, correo, institucion, tipo, carreras }) => {
    // TODO: try to make everytinhg work with a single transaction

    if (carreras) {
      return knex('Programa')
        .where({
          id
        })
        .update({
          nombre,
          descripcion,
          telefono,
          correo,
          institucion,
          tipo
        }).then(() => {
          return knex.transaction(trx => {
            return trx('Programa_carrera').where({
              id_programa: id
            }).del().then(() => {
              let carrerasObj = []
              carreras.forEach(carrera => carrerasObj.push({ 'clave_carrera': carrera, 'id_programa': id }))

              return trx('Programa_carrera').insert(carrerasObj)
            })
          })
        })
    }
    else {
      return knex('Programa')
        .where({
          id
        })
        .update({
          nombre,
          descripcion,
          telefono,
          correo,
          institucion,
          tipo
        })
    }

  }

  // TODO: drop column estado from programa_carrera
  const deleteProgramas = ({ id }) => {
    return knex('Programa')
      .where({
        id
      })
      .update({
        estado: 1
      })
  }

  const getProgramasporTipo = ({ tipo }) => {
    return knex('Programa')
      .leftOuterJoin(
        'Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .where({
        tipo,
        'Programa.estado': 0
      })
      .select(
        'Programa.id',
        'Programa.nombre',
        'Programa.descripcion',
        'Programa.telefono',
        'Programa.correo',
        'Programa.institucion',
        'Programa.tipo',
        'Programa_carrera.clave_carrera'
      )
  }

  const getPrograma = ({ id }) => {
    return knex('Programa')
      .leftOuterJoin(
        'Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .where({
        'Programa.id': id,
        'Programa.estado': 0
      })
      .select(
        'Programa.id',
        'Programa.nombre',
        'Programa.descripcion',
        'Programa.telefono',
        'Programa.correo',
        'Programa.institucion',
        'Programa.tipo',
        'Programa_carrera.clave_carrera'
      )
  }

  const getLastProgramID = () => {
    return knex('Programa').max('id', { as: 'id' })
  }

  const postRegistro = ({ codigo_estudiante, id_programa, fecha_registro }) => {
    // TODO
  }

  // FAVORITOS

  const postGuardarFavoritos = ({ codigo_estudiante, id_programa }) => {
    // TODO

  }

  const postObtenerFavoritos = ({ codigo_estudiante }) => {
    // TODO
  }

  const deleteFavoritos = ({ codigo_estudiante, id_programa }) => {
    // TODO
  }

  return {
    login,
    loginAdministrador,
    postEstudianteDatos,
    postEstudiante,
    patchEstudiante,
    getCarreras,
    postCarreras,
    postProgramas,
    patchProgramas,
    deleteProgramas,
    getProgramasporTipo,
    getPrograma,
    postAdministrador,
    patchAdministrador,
    postGuardarFavoritos,
    postObtenerFavoritos,
    deleteFavoritos,
    postRegistro,
    getLastProgramID
  }
}

module.exports = {
  databaseService
}
