import {List} from 'immutable'

export interface Fallo<A> {
    error: true
    resultado: A
}

export interface Exito<A> {
    error: false
    resultado: A
}

export interface Token {
    nombre: string
    texto: string
    tipo: 'var' | 'valor' | 'conectivo' | 'parentesis'
    pos: number
}

export interface Variables {
    [nombre: string]: boolean
}

export interface EstadoEvaluacion {
    expresion: List<Token>
    pila: List<boolean>
}

export interface ErrorMultiple {
    nombre: 'ErrorMultiple'
    errores: (CaracterInesperado | ParentesisAbierto)[]
}

export type ErrorPosible = ParentesisAbierto | ParentesisExtraviado | CaracterInesperado | OperandoFaltante

export interface ErrorBase {
    nombre: string
    pos: number
}

export interface OperandoFaltante extends ErrorBase {
    nombre: 'OperandoFaltante'
}

export interface ParentesisExtraviado extends ErrorBase {
    nombre: 'ParentesisExtraviado'
}

export interface CaracterInesperado extends ErrorBase {
    nombre: 'CaracterInesperado'
    caracter: string
}

export interface ParentesisAbierto extends ErrorBase {
    nombre: 'ParentesisAbierto'
    // pos: el indice del parentesis que falta cerrar
}

export interface ExpresionLeida {
    pos: number
    tokens: List<Token>
    vars: List<string>
}

export class Nodo<A> {
    private _contenido: A
    private _izquierda: Nodo<A>
    private _derecha: Nodo<A>
    private contenido_set: boolean

    constructor() {
        this.contenido_set = false
        this._izquierda = null
        this._derecha = null
    }

    set contenido(c: A) {
        /**
         * Por las dudas agrego esto para detectar bugs donde se cambia el contenido de un nodo.
         * Una vez que las pruebas pasen se puede borrar.
         */
        if (!this.contenido_set) {
            this._contenido = c
            this.contenido_set = true
        }
        else {
            throw new Error('El contenido de este nodo ya fue establecido')
        }
    }

    get contenido(): A {
        return this._contenido
    }

    set izquierda(i: Nodo<A>) {
        this._izquierda = i
    }

    get izquierda(): Nodo<A> {
        return this._izquierda
    }

    set derecha(d: Nodo<A>) {
        this._derecha = d
    }

    get derecha(): Nodo<A> {
        return this._derecha
    }
}