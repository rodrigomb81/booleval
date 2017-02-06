import {List} from 'immutable'

interface Fallo<A> {
    error: true
    resultado: A
}

interface Exito<A> {
    error: false
    resultado: A
}

export interface Token {
    nombre: string
    texto: string
    tipo: 'var' | 'valor' | 'conectivo' | 'parentesis'
}

export interface CaracterInesperado {
    pos?: number
    caracter: string
}

/**
 * evaluar$: es simplemente una envoltura para evaluar, que es la funcion que realmente calcula el resultado
 */
function evaluar$(expresion: string): boolean[] {
    return [true]
}

/**
 * evaluar: reduce una expresion en rpn a una pila de valores booleanos
 */
function evaluar(expresion: List<Token>, stack: List<boolean>): List<boolean> {
    return List([true])
}

/**
 * rpn$: envoltura para rpn que recorre el arbol en orden para generar una expresion rpn...tal vez no sea necesaria
 */

/**
 * rpn: reordena una lista de simbolos para convertirlos en una expresion RPN
 */
function rpn(expresion: List<Token>): List<Token> {
    return List([])
}

/**
 * leer: envoltura para leer$...solo sirve para la primer invocacion
 */
export function leer(expresion: string): Fallo<CaracterInesperado> | Exito<List<Token>> {
    return leer$(expresion, {error: false, resultado: List([])})
}

/**
 * leer$ reduce una cadena a una lista de simbolos (variables y conectivos)
 */
export function leer$(expresion: string, maybe_tokens: Fallo<CaracterInesperado> | Exito<List<Token>>): Fallo<CaracterInesperado> | Exito<List<Token>> {
    /**
     * cosas que pueden aparecer al leer una expresion:
     * una palabra (una variable)
     * un conectivo
     * un "(" o un ")"
     * un valor (T o C)
     */
    const palabra = /^[a-z]+/
    const conectivo = /^[&\|>=!]/
    const parens = /^[\(\)]/
    const valor = /^[TC]/
    const espacio_en_blanco = /^\s+/

    if (expresion.length > 0 || maybe_tokens.error)  {
        // si llegamos aca todavia quedan simbolos en la cadena y no hubo errores
        const tokens = maybe_tokens.resultado as List<Token>

        if (palabra.test(expresion)) {
            // extraer la palabra
            const texto = expresion.match(palabra)[0]
            const token: Token = {nombre: texto, texto, tipo: 'var'}
            return leer$(expresion.substr(texto.length), {error: false, resultado: tokens.push(token)})
        }
        else if (conectivo.test(expresion)) {
            // extraer el conectivo
            const texto = expresion.match(conectivo)[0]
            const nombre = conectivos_nombres[texto]
            return leer$(expresion.substr(1), {error: false, resultado: tokens.push({nombre, texto, tipo: 'conectivo'})})
        }
        else if (parens.test(expresion)) {
            // extraer el parentesis
            const texto = expresion.match(parens)[0]
            const nombre = texto == ')' ? 'par-derecho':'par-izquierdo'
            return leer$(expresion.substr(1), {error: false, resultado: tokens.push({nombre, texto, tipo: 'parentesis'})})
        }
        else if (valor.test(expresion)) {
            // extraer el valor
            const texto = expresion.match(valor)[0]
            const nombre = texto == 'T' ? 'tautologia':'contradiccion'
            return leer$(expresion.substr(1), {error: false, resultado: tokens.push({nombre, texto, tipo: 'valor'})})
        }
        else if (espacio_en_blanco.test(expresion)) {
            const espacio = expresion.match(espacio_en_blanco)
            return leer$(expresion.substr(espacio.length), maybe_tokens)
        }
        else {
            // nos encontramos con un valor inesperado (un numero, por ejemplo)
            return {error: true, resultado: {caracter: expresion[1]}}
        }
    }
    else {
        return maybe_tokens
    }
}

const conectivos_nombres: {[nombre: string]: string} = {
    '&': 'conjuncion'   ,
    '|': 'disyuncion'   ,
    '!': 'complemento'  ,
    '>': 'implicacion'  ,
    '=': 'equivalencia'
}