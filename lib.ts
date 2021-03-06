/**
 * Este archivo contiene las funciones que realmente hacen el trabajo leer una expresion,
 * buscar errores en ella, y calcular su valor.
 */


import {List} from 'immutable'
import {Fallo, Exito, ErrorPosible, ExpresionLeida, EstadoEvaluacion, CaracterInesperado, OperandoFaltante, Nodo, Token, Variables} from './interfaces'

const conectivos_operadores: {[nombre: string]: (a: boolean, b: boolean) => boolean} = {
    '&': (a, b) => a && b,
    '|': (a, b) => a || b,
    '>': (a, b) => !a || b,
    '=': (a, b) => a == b
}

const conectivos_nombres: {[nombre: string]: string} = {
    '&': 'conjuncion'   ,
    '|': 'disyuncion'   ,
    '!': 'complemento'  ,
    '>': 'implicacion'  ,
    '=': 'equivalencia'
}

const conectivos_precedencia: {[nombre: string]: number} = {
    '&': 2,
    '|': 1,
    '!': 0,
    '>': 3,
    '=': 4,
}

/**
 * evaluar$: reduce una expresion en rpn a una pila de valores booleanos
 */
export function evaluar$(variables: Variables, estado_maybe: Fallo<OperandoFaltante> | Exito<EstadoEvaluacion>): Fallo<OperandoFaltante> | Exito<EstadoEvaluacion> {
    if (!estado_maybe.error) {
        const {expresion, pila} = estado_maybe.resultado as EstadoEvaluacion
        if (expresion.size > 0) {
            const elemento = expresion.get(0)
            let proximo_estado: EstadoEvaluacion;

            switch (elemento.tipo) {
                case 'var':
                proximo_estado = { pila: pila.push(variables[elemento.nombre]), expresion: expresion.shift() }
                break
                case 'conectivo':
                {
                    if (elemento.nombre == 'complemento') {
                        proximo_estado = { pila: pila.pop().push(!pila.last()), expresion: expresion.shift() }
                    }
                    else if (pila.size >= 2) {
                        const operando_b = pila.last()
                        const operando_a = pila.pop().last()

                        const operador = conectivos_operadores[elemento.texto]

                        proximo_estado = { pila: pila.pop().pop().push(operador(operando_a, operando_b)), expresion: expresion.shift() }
                    }
                    else {
                        return {error: true, resultado: {nombre: 'OperandoFaltante', pos: elemento.pos}}
                    }
                }
                break
                case 'valor':
                proximo_estado = { pila: pila.push(elemento.nombre == 'tautologia'), expresion: expresion.shift()}
                break
            }

            return evaluar$(variables, {error: false, resultado: proximo_estado})
        }
        else {
            // se llegó al final de la evaluación
            return estado_maybe
        }
    }
    else {
        return estado_maybe
    }
}

/**
 * leer$ reduce una cadena a una lista de simbolos (variables y conectivos)
 */
export function leer$(expresion: string, exp_maybe: Fallo<CaracterInesperado> | Exito<ExpresionLeida>): Fallo<CaracterInesperado> | Exito<ExpresionLeida> {
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

    if (expresion.length > 0 && !exp_maybe.error)  {
        // si llegamos aca todavia quedan simbolos en la cadena y no hubo errores
        const exp = exp_maybe.resultado as ExpresionLeida

        if (palabra.test(expresion)) {
            // extraer la palabra
            const texto = expresion.match(palabra)[0]
            const token: Token = {nombre: texto, texto, tipo: 'var', pos: exp.pos}
            const pos = exp.pos + texto.length
            const vars = exp.vars.indexOf(texto) >= 0 ? exp.vars:exp.vars.push(texto) // agregar una variable solo si aun no esta en la lista
            return leer$(expresion.substr(texto.length), {error: false, resultado: {pos, tokens: exp.tokens.push(token), vars}})
        }
        else if (conectivo.test(expresion)) {
            // extraer el conectivo
            const texto = expresion.match(conectivo)[0]
            const nombre = conectivos_nombres[texto]
            const token: Token = {nombre, texto, tipo: 'conectivo', pos: exp.pos}
            return leer$(expresion.substr(1), {error: false, resultado: {pos: exp.pos + 1, tokens: exp.tokens.push(token), vars: exp.vars}})
        }
        else if (parens.test(expresion)) {
            // extraer el parentesis
            const texto = expresion.match(parens)[0]
            const nombre = texto == ')' ? 'par-derecho':'par-izquierdo'
            const token: Token = {nombre, texto, tipo: 'parentesis', pos: exp.pos}
            return leer$(expresion.substr(1), {error: false, resultado: {pos: exp.pos + 1, tokens: exp.tokens.push(token), vars: exp.vars}})
        }
        else if (valor.test(expresion)) {
            // extraer el valor
            const texto = expresion.match(valor)[0]
            const nombre = texto == 'T' ? 'tautologia':'contradiccion'
            const token: Token = {nombre, texto, tipo: 'valor', pos: exp.pos}
            return leer$(expresion.substr(1), {error: false, resultado: {pos: exp.pos + 1, tokens: exp.tokens.push(token), vars: exp.vars}})
        }
        else if (espacio_en_blanco.test(expresion)) {
            const espacio = expresion.match(espacio_en_blanco)
            return leer$(expresion.substr(espacio.length), {error: false, resultado: {pos: exp.pos + espacio.length, tokens: exp.tokens, vars: exp.vars}})
        }
        else {
            // nos encontramos con un valor inesperado (un numero, por ejemplo)
            return {error: true, resultado: {nombre: 'CaracterInesperado', pos: exp.pos, caracter: expresion[1]}}
        }
    }
    else {
        return exp_maybe
    }
}

/**
 * zipToObj: crea un objeto donde cada clave del primer argumento toma un valor correspondiente del segundo argumento
 */
export function zipToObj<A>(keys: string[], values: A[]): {[k: string]: A} {
    const obj: {[k: string]: A} = {}
    keys.forEach((key, index) => {
        obj[key] = values[index]
    })
    return obj
}

export function generar_tabla(variables: number): boolean[][] {
    const total = Math.pow(2, variables)
    const filas: boolean[][] = rango(total).map(i => i.toString(2)).map(i => left_pad('0', variables, i)).map(i => i.split('').map(i => i == '1')).reverse()
    return filas
}

function left_pad(padder: string, longitud: number, cadena_original: string): string {
    let nueva_cadena = cadena_original
    for (let i = cadena_original.length; i < longitud; i++) {
        nueva_cadena = padder +  nueva_cadena
    }
    return nueva_cadena
}
/**
 * rango: devuelve un arreglo de valores de 0 a longitud - 1
 */
function rango(longitud: number): number[] {
    const a: number[] = []
    for (let i = 0; i < longitud; i++) {
        a.push(i)
    }
    return a
}

export function aplastar<A>(nodo: Nodo<A>): A[] {
    if (nodo != null) {
        let izquierda: A[] = []
        let derecha: A[] = []

        if (nodo.izquierda != null) {
            izquierda = aplastar(nodo.izquierda)
        }

        if (nodo.derecha != null) {
            derecha = aplastar(nodo.derecha)
        }

        return [...izquierda, ...derecha, nodo.contenido]
    }
    else {
        return []
    }
}

/**
 * arbol_optimista: crea un arbol a partir de una expresion asumiendo que es CORRECTA (no tiene errores)
 */
export function arbol_optimista(expresion: List<Token>, raiz: Nodo<Token>): Nodo<Token> {
    if (expresion.size > 0) {
        let tokens: List<Token> = null

        if (expresion.get(0).tipo == 'parentesis') {
            // remover parentesis al principio y al final
            tokens = List(expresion.toArray().slice(1, buscarPareja(expresion)))
        }
        else {
            tokens = expresion
        }

        const indice = buscarConectivo(tokens).resultado as number

        if (indice != -1 ) {
            raiz.contenido = tokens.get(indice)
            const mitad_izq = List(tokens.toArray().slice(0, indice))
            const mitad_der = List(tokens.toArray().slice(indice + 1))
            raiz.izquierda = arbol_optimista(mitad_izq, new Nodo<Token>())
            raiz.derecha = arbol_optimista(mitad_der, new Nodo<Token>())
            return raiz
        }
        else {
            raiz.contenido = tokens.get(0)
            raiz.izquierda = null
            raiz.derecha = null
            return raiz
        }
    }
    else {
        return null
    }
}

/**
 * arbol: crea un arbol a partir de una expresion. Este arbol puede ser "aplastado" para obtener una lista de tokens
 * que se puede evaluar como expresion rpn, o puede evaluarse directamente.
 */
export function arbol(expresion: List<Token>, raiz_maybe: Fallo<ErrorPosible> | Exito<Nodo<Token>>): Fallo<ErrorPosible> | Exito<Nodo<Token>> {
    if (!raiz_maybe.error) {
        const raiz = raiz_maybe.resultado as Nodo<Token>
        if (expresion.size > 0) {
            let tokens: List<Token> = null

            // remover parentesis si es necesario y manejar errores posibles
            if (expresion.get(0).tipo == 'parentesis') {
                if (expresion.get(0).nombre == 'par-izquierdo') {
                    const indice_pareja = buscarPareja(List(expresion))
                    if (indice_pareja != -1) {
                        tokens = List(expresion.toArray().slice(1, indice_pareja))
                    }
                    else {
                        return {error: true, resultado: {nombre: 'ParentesisAbierto', pos: expresion.get(0).pos}}
                    }
                }
                else {
                    return {error: true, resultado: {nombre: 'ParentesisExtraviado', pos: expresion.get(0).pos}}
                }
            }
            else {
                tokens = expresion
            }

            // indice del conectivo que sera el contenido de este nodo
            const indice_maybe = buscarConectivo(List(tokens))

            if (!indice_maybe.error) {
                const indice = indice_maybe.resultado as number

                if (indice != -1) {

                    // si hay conectivo, usarlo como contenido de la raiz y generar las ramas
                    raiz.contenido = tokens.get(indice)

                    const mitad_izq = List(tokens.toArray().slice(0, indice))
                    const rama_izq_maybe = arbol(mitad_izq, {error: false, resultado: new Nodo<Token>()})

                    const mitad_der = List(tokens.toArray().slice(indice + 1))
                    const rama_der_maybe = arbol(mitad_der, {error: false, resultado: new Nodo<Token>()})

                    if (rama_izq_maybe.error == false && rama_der_maybe.error == false) {
                        // si llegamos aca, todo salió bien
                        raiz.izquierda = rama_izq_maybe.resultado as Nodo<Token>
                        raiz.derecha = rama_der_maybe.resultado as Nodo<Token>

                        return {error: false, resultado: raiz}
                    }
                    else {
                        // devolver el error encontrado, dandole prioridad al error de la rama izquierda
                        return rama_izq_maybe.error ? rama_izq_maybe:rama_der_maybe
                    }
                }
                else {
                    // no hay conectivo, este nodo solo contiene una variable y no tiene ramas
                    raiz.contenido = tokens.get(0)
                    raiz.izquierda = null
                    raiz.derecha = null
                    return {error: false, resultado: raiz}
                }
            }
            else {
                return indice_maybe
            }
        }
        else {
            return {error: false, resultado: null}
        }
    }
    else {
        return raiz_maybe
    }
}

/**
 * buscarConectivo devuelve el indice del conectivo de mayor precedencia de la expresion. Si la
 * expresion no tiene conectivos, devuelve -1. Si el conectivo de mayor precedencia se repite,
 * devuelve el indice del primero. Los conectivos dentro de parentesis son salteados.
 */
export function buscarConectivo(expresion: List<Token>): Fallo<ErrorPosible> | Exito<number> {
    let indice = 0;
    let precedencia_max = -1;

    for (let i = 0; i < expresion.size; i++) {
        let simbolo = expresion.get(i)
        if (simbolo.tipo == 'parentesis') {
            if (simbolo.nombre == 'par-derecho') {
                return {error: true, resultado: {nombre: 'ParentesisExtraviado', pos: simbolo.pos}}
            }
            else {
                const indice_pareja = buscarPareja(expresion, i)

                if (indice_pareja == -1) {
                    return {error: true, resultado: {nombre: 'ParentesisAbierto', pos: simbolo.pos}}
                }
                else {
                    i = indice_pareja
                }
            }
        }
        else if (simbolo.tipo == 'conectivo') {
            if (conectivos_precedencia[simbolo.texto] > precedencia_max) {
                indice = i
                precedencia_max = conectivos_precedencia[simbolo.texto]
            }
        }
    }

    if (precedencia_max == -1) {
        // esto significa que no se encontro NINGUN conectivo en la expresion
        return {error: false, resultado: -1}
    }
    else {
        return {error: false, resultado: indice}
    }
}

export function buscarPareja(expresion: List<Token>, desde: number = 0): number {
    /**
     * Indice de la pareja
     */
    let indice = desde + 1
    let pars_abiertos = 1
    while (indice < expresion.size && pars_abiertos > 0) {
        const token = expresion.get(indice)
        if (token.nombre == 'par-izquierdo') {
            pars_abiertos++
        }
        else if (token.nombre == 'par-derecho') {
            pars_abiertos--
        }
        if (pars_abiertos > 0) {
            indice++
        }
    }

    if (pars_abiertos > 0) {
        return -1
    }
    else {
        return indice
    }
}