import {leer, rpn, evaluar} from './index'
import {List} from 'immutable'

const resultado_maybe = evaluar(rpn(leer('a = !a & b')))

const resultado = resultado_maybe.resultado as boolean[]