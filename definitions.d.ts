import { List } from 'immutable';

export interface Fallo<A> {
    error: true;
    resultado: A;
}

export interface Exito<A> {
    error: false;
    resultado: A;
}

export interface Token {
    nombre: string;
    texto: string;
    tipo: 'var' | 'valor' | 'conectivo' | 'parentesis';
    pos: number;
}

export interface Variables {
    [nombre: string]: boolean;
}

export interface EstadoEvaluacion {
    expresion: List<Token>;
    pila: List<boolean>;
}

export interface ErrorMultiple {
    nombre: 'ErrorMultiple';
    errores: (CaracterInesperado | ParentesisAbierto)[];
}

export declare type ErrorPosible = ParentesisAbierto | ParentesisExtraviado | CaracterInesperado | OperandoFaltante;

export interface ErrorBase {
    nombre: string;
    pos: number;
}

export interface OperandoFaltante extends ErrorBase {
    nombre: 'OperandoFaltante';
}

export interface ParentesisExtraviado extends ErrorBase {
    nombre: 'ParentesisExtraviado';
}

export interface CaracterInesperado extends ErrorBase {
    nombre: 'CaracterInesperado';
    caracter: string;
}

export interface ParentesisAbierto extends ErrorBase {
    nombre: 'ParentesisAbierto';
}

export interface ExpresionLeida {
    pos: number;
    tokens: List<Token>;
    vars: List<string>;
}

export function evaluar(exp_maybe: Fallo<ErrorPosible> | Exito<ExpresionLeida>): Fallo<ErrorPosible> | Exito<{vars: boolean[][], exp: boolean[]}>

export function rpn(expresion_maybe: Fallo<CaracterInesperado> | Exito<ExpresionLeida>): Fallo<ErrorPosible> | Exito<ExpresionLeida>

export function leer(expresion: string): Fallo<CaracterInesperado> | Exito<ExpresionLeida>