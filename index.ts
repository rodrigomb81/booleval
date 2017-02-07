import {List} from 'immutable'
import {Fallo, Exito, ErrorPosible, ExpresionLeida, EstadoEvaluacion, CaracterInesperado, OperandoFaltante, Nodo, Token, Variables} from './interfaces'
import {generar_tabla,  arbol, evaluar$, leer$, aplastar, zipToObj} from './lib'

/**
 * evaluar: evalua una expresion y devuelve el resultado o el error encontrado en ella
 */
export function evaluar(exp_maybe: Fallo<ErrorPosible> | Exito<ExpresionLeida>): Fallo<ErrorPosible> | Exito<boolean[]> {
    if (!exp_maybe.error) {
        const {tokens, vars} = exp_maybe.resultado as ExpresionLeida
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

        return {error: false, resultado: resultados}
    }
    else {
        return exp_maybe
    }
}

/**
 * rpn: convierte una expresion en forma de arbol a una expresion rpn
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
 * leer: convierte una cadena a una lista de tokens expresion
 */
export function leer(expresion: string): Fallo<CaracterInesperado> | Exito<ExpresionLeida> {
    return leer$(expresion, {error: false, resultado: {pos: 0, tokens: List([]), vars: List([])}})
}