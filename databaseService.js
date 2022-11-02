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

  const postAdministradorDatos = ({ id }) => {
    return knex('Administrador').where({
      id,
      estado: 0
    }).select()
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

  const getProgramas = () => {
    return knex('Programa')
      .leftOuterJoin(
        'Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .where({
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

  const postRegistro = ({ codigo_estudiante, id_programa }) => {
    return knex('Programa_estudiante').insert({
      codigo_estudiante,
      id_programa
    }).then(() => {
      return knex('Programa')
        .leftOuterJoin(
          'Programa_estudiante',
          'Programa_estudiante.id_programa',
          '=',
          'Programa.id')
        .leftOuterJoin(
          'Estudiante',
          'Estudiante.codigo',
          '=',
          'Programa_estudiante.codigo_estudiante'
        )
        .where({
          'Estudiante.codigo': codigo_estudiante,
          'Programa.id': id_programa
        })
        .column(
          { nombre_programa: 'Programa.nombre' },
          'Programa.correo',
          'Programa.institucion',
          'Programa.tipo',
          'Estudiante.codigo',
          { nombre_estudiante: 'Estudiante.nombre' },
          'Estudiante.primer_apellido',
          'Estudiante.segundo_apellido',
          'Estudiante.clave_carrera',
          'Estudiante.num_semestre',
          'Estudiante.estatus',
          'Estudiante.correo_estudiante'
        ).select()
    })
  }

  // FAVORITOS

  const postGuardarFavoritos = ({ codigo_estudiante, id_programa }) => {
    return knex('Programa_guardado').insert({
      codigo_estudiante,
      id_programa
    })
  }

  const postObtenerFavoritos = ({ codigo_estudiante }) => {
    return knex('Programa')
      .leftOuterJoin('Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .leftOuterJoin(
        'Programa_guardado',
        'Programa_guardado.id_programa',
        '=',
        'Programa.id'
      )
      .where({
        'Programa_guardado.codigo_estudiante': codigo_estudiante,
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

  const deleteFavoritos = ({ codigo_estudiante, id_programa }) => {
    return knex('Programa_guardado').where({
      codigo_estudiante,
      id_programa
    }).del()
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
    getProgramas,
    getProgramasporTipo,
    getPrograma,
    postAdministrador,
    postAdministradorDatos,
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
