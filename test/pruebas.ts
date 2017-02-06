import 'mocha'
import 'should'

import {leer, Token, CaracterInesperado} from '../index'
import {List} from 'immutable'

describe('Toda clase de pruebas:', () => {
    describe('leer:', () => {
        it('todos los simbolos', () => {
            const e = '! > = | & variable T C ()' 
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(false)
            const tokens = (tokens_maybe.resultado as List<Token>).toArray()
            tokens[0].should.deepEqual({nombre: 'complemento', texto: '!', tipo: 'conectivo'})
            tokens[1].should.deepEqual({nombre: 'implicacion', texto: '>', tipo: 'conectivo'})
            tokens[2].should.deepEqual({nombre: 'equivalencia', texto: '=', tipo: 'conectivo'})
            tokens[3].should.deepEqual({nombre: 'disyuncion', texto: '|', tipo: 'conectivo'})
            tokens[4].should.deepEqual({nombre: 'conjuncion', texto: '&', tipo: 'conectivo'})
            tokens[5].should.deepEqual({nombre: 'variable', texto: 'variable', tipo: 'var'})
            tokens[6].should.deepEqual({nombre: 'tautologia', texto: 'T', tipo: 'valor'})
            tokens[7].should.deepEqual({nombre: 'contradiccion', texto: 'C', tipo: 'valor'})
            tokens[8].should.deepEqual({nombre: 'par-izquierdo', texto: '(', tipo: 'parentesis'})
            tokens[9].should.deepEqual({nombre: 'par-derecho', texto: ')', tipo: 'parentesis'})
        })
        
        it('expresion sin errores', () => {
            const e = 'una | otra'
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(false)
            const tokens = (tokens_maybe.resultado as List<Token>).toArray()
            tokens[0].should.deepEqual({nombre: 'una', texto: 'una', tipo: 'var'})
            tokens[1].should.deepEqual({nombre: 'disyuncion', texto: '|', tipo: 'conectivo'})
            tokens[2].should.deepEqual({nombre: 'otra', texto: 'otra', tipo: 'var'})
        })

        it('expresion con un error', () => {
            const e = '22 | otra'
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(true)
            const error = (tokens_maybe.resultado as CaracterInesperado)
            error.caracter.should.equal('2')
        })
    })
})