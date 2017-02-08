/**
 * Este archivo presenta la interfaz de la libreria. Las funciones que exporta 'delegan' el trabajo a las
 * de `lib.ts` y solo sirven para que sea mas facil consumirlas.
 */

import {List} from 'immutable'
import {Fallo, Exito, ErrorPosible, ExpresionLeida, EstadoEvaluacion, CaracterInesperado, OperandoFaltante, Nodo, Token, Variables} from './interfaces'
import {generar_tabla,  arbol, evaluar$, leer$, aplastar, zipToObj} from './lib'

/**
 * evaluar: es simplemente una envoltura para evaluar$, que es la funcion que realmente calcula el resultado
 */
export function evaluar(exp_maybe: Fallo<ErrorPosible> | Exito<ExpresionLeida>): Fallo<ErrorPosible> | Exito<{vars: boolean[][], exp: boolean[]}> {
    if (!exp_maybe.error) {
        const {tokens, vars} = exp_maybe.resultado as ExpresionLeida
        if (tokens.size > 0) {
            /**
             * tabla de valores para las variables
             */
            const tabla = generar_tabla(vars.size)

            const variables_cargadas = tabla.map((valores, indice) => zipToObj(vars.toArray(), valores))

            const resultados: boolean[] = []
            for (let i = 0; i < variables_cargadas.length; i++) {
                const r = evaluar$(variables_cargadas[i], {error: false, resultado: {expresion: tokens, pila: List([])}})
                if (r.error) {
                    return r
                }
                else {
                    resultados.push((r.resultado as EstadoEvaluacion).pila.last())
                }
            }

            return {error: false, resultado: {vars: tabla, exp: resultados}}
        }
        else {
            return {error: false, resultado: {vars: [], exp: []}}
        }
    }
    else {
        return exp_maybe
    }
}

/**
 * rpn: envoltura para `aplastar`, devuelve el error encontrado o una lista de tokens que se puede evaluar facilmente
 */

export function rpn(expresion_maybe: Fallo<CaracterInesperado> | Exito<ExpresionLeida>): Fallo<ErrorPosible> | Exito<ExpresionLeida> {
    if (expresion_maybe.error) {
        return expresion_maybe
    }
    else {
        const {tokens, vars, pos} = (expresion_maybe.resultado as ExpresionLeida)
        const arbol_maybe = arbol(tokens, {error: false, resultado: new Nodo<Token>()})
        if (arbol_maybe.error) {
            return arbol_maybe
        }
        else {
            return {error: false, resultado: {tokens: List(aplastar(arbol_maybe.resultado as Nodo<Token>)), vars, pos}}
        }
    }
}


/**
 * leer: envoltura para leer$...solo sirve para la primer invocacion
 */
export function leer(expresion: string): Fallo<CaracterInesperado> | Exito<ExpresionLeida> {
    return leer$(expresion, {error: false, resultado: {pos: 0, tokens: List([]), vars: List([])}})
}