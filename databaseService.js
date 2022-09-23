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

  // LOGIN
  const login = ({ correo_estudiante, contrasena }) => {
    return knex('Estudiante').where({
      correo_estudiante: correo_estudiante,
      contrasena: contrasena,
      estado: 0
    }).select()
  }

  // ESTUDIANTE

  const getEstudiante = () => {
    // TODO: hacer más tarde
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

  const postAdministrador = ({ nombre, primer_apellido, segundo_apellido, correo, contrasena }) => {
    return knex('Administrador').insert({
      nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      contrasena
    })
  }

  const patchEstudiante = ({ codigoOri, codigo, nombre, primer_apellido, segundo_apellido, contrasena, clave_carrera, ciclo_escolar, num_semestre, estatus, correo_estudiante }) => {
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
        correo_estudiante: correo_estudiante
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

  // TODO: Agregar imagen
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
        carreras.forEach(carrera => carrera.id_programa = ids[0])
        return trx('Programa_carrera').insert(carreras)
      })
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
        'Programa.imagen',
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
        'Programa.imagen',
        'Programa.tipo',
        'Programa_carrera.clave_carrera'
      )
  }

  return {
    login,
    getEstudiante,
    postEstudiante,
    patchEstudiante,
    getCarreras,
    postCarreras,
    postProgramas,
    getProgramasporTipo,
    getPrograma,
    postAdministrador
  }
}

module.exports = {
  databaseService
}
