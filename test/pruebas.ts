import 'mocha'
import 'should'

import {leer, Token, CaracterInesperado, ExpresionLeida, buscarPareja, buscarConectivo} from '../index'
import {Nodo, arbol, arbol_optimista, rpn} from '../index'
import {List} from 'immutable'

describe('Toda clase de pruebas:', () => {
    describe('leer:', () => {
        it('todos los simbolos', () => {
            const e = '!>=|&vTC()' 
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(false)
            const tokens = (tokens_maybe.resultado as ExpresionLeida).tokens.toArray()
            tokens[0].should.deepEqual({nombre: 'complemento', texto: '!', tipo: 'conectivo', pos: 0})
            tokens[1].should.deepEqual({nombre: 'implicacion', texto: '>', tipo: 'conectivo', pos: 1})
            tokens[2].should.deepEqual({nombre: 'equivalencia', texto: '=', tipo: 'conectivo', pos: 2})
            tokens[3].should.deepEqual({nombre: 'disyuncion', texto: '|', tipo: 'conectivo', pos: 3})
            tokens[4].should.deepEqual({nombre: 'conjuncion', texto: '&', tipo: 'conectivo', pos: 4})
            tokens[5].should.deepEqual({nombre: 'v', texto: 'v', tipo: 'var', pos: 5})
            tokens[6].should.deepEqual({nombre: 'tautologia', texto: 'T', tipo: 'valor', pos: 6})
            tokens[7].should.deepEqual({nombre: 'contradiccion', texto: 'C', tipo: 'valor', pos: 7})
            tokens[8].should.deepEqual({nombre: 'par-izquierdo', texto: '(', tipo: 'parentesis', pos: 8})
            tokens[9].should.deepEqual({nombre: 'par-derecho', texto: ')', tipo: 'parentesis', pos: 9})
        })
        
        it('expresion sin errores', () => {
            const e = 'una | otra'
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(false)
            const tokens = (tokens_maybe.resultado as ExpresionLeida).tokens.toArray()
            tokens[0].should.deepEqual({nombre: 'una', texto: 'una', tipo: 'var', pos: 0})
            tokens[1].should.deepEqual({nombre: 'disyuncion', texto: '|', tipo: 'conectivo', pos: 4})
            tokens[2].should.deepEqual({nombre: 'otra', texto: 'otra', tipo: 'var', pos: 6})
        })

        it('expresion con un error', () => {
            const e = '22 | otra'
            const tokens_maybe = leer(e)

            tokens_maybe.error.should.equal(true)
            const error = (tokens_maybe.resultado as CaracterInesperado)
            error.caracter.should.equal('2')
        })
    })

  describe('buscarPareja:', () => {
      it('encuentra la pareja buscada', () => {
          const tokens = (leer('(hola)').resultado as ExpresionLeida).tokens
          const indice = buscarPareja(tokens)
          indice.should.equal(2)
      })

      it('devuelve -1 cuando hay un parentesis abierto', () => {
          const tokens = (leer('(hola').resultado as ExpresionLeida).tokens
          const indice = buscarPareja(tokens)
          indice.should.equal(-1)
      })
  })

  describe('buscarConectivo', () => {
      it('encuentra el conectivo', () => {
          const tokens = (leer('a | c & b').resultado as ExpresionLeida).tokens
          const indice_maybe = buscarConectivo(tokens)
          indice_maybe.error.should.equal(false)
          indice_maybe.resultado.should.equal(3)
      })

      it('encuentra el conectivo de nuevo', () => {
          const tokens = (leer('(a = c) & b').resultado as ExpresionLeida).tokens
          const indice_maybe = buscarConectivo(tokens)
          indice_maybe.error.should.equal(false)
          indice_maybe.resultado.should.equal(5)
      })

      it('ignora conectivos entre parentesis', () => {
          const tokens = (leer('a | (a & b)').resultado as ExpresionLeida).tokens
          const indice_maybe = buscarConectivo(tokens)
          indice_maybe.error.should.equal(false)
          indice_maybe.resultado.should.equal(1)
      })

      it('detecta un parentesis abierto', () => {
          const tokens = (leer('(a | c & b').resultado as ExpresionLeida).tokens
          const indice_maybe = buscarConectivo(tokens)
          indice_maybe.error.should.equal(true)
          indice_maybe.resultado.should.deepEqual({nombre: 'ParentesisAbierto', pos: 0})
      })

      it('devuelve -1 cuando no encuentra nada', () => {
          const tokens = (leer('a').resultado as ExpresionLeida).tokens
          const indice_maybe = buscarConectivo(tokens)
          indice_maybe.error.should.equal(false)
          indice_maybe.resultado.should.equal(-1)
      })

      it('remueve una pareja de parentesis', () => {
          const expresion =  (leer('(a&b)').resultado as ExpresionLeida).tokens
          const sin_parentesis = List(expresion.toArray().slice(1, buscarPareja(expresion)))
          sin_parentesis.get(0).should.deepEqual({tipo: 'var', nombre: 'a', texto: 'a', pos: 1})
          sin_parentesis.get(2).should.deepEqual({tipo: 'var', nombre: 'b', texto: 'b', pos: 3})
      })
  })

  describe('arbol', () => {
      it('optimista', () => {
          const tokens = (leer('(a&b)').resultado as ExpresionLeida).tokens
          const arbol = arbol_optimista(tokens, new Nodo<Token>())
          arbol.contenido.should.equal(tokens.get(2))
          
          arbol.izquierda.contenido.should.equal(tokens.get(1))
          should.assert(arbol.izquierda.izquierda == null, 'La rama izquierda no es null')
          should.assert(arbol.izquierda.derecha == null, 'La rama derecha no es null')

          arbol.derecha.contenido.should.equal(tokens.get(3))
          should.assert(arbol.derecha.izquierda == null, 'La rama izquierda no es null')
          should.assert(arbol.derecha.derecha == null, 'La rama derecha no es null')
      })

      it('V2', () => {
          const tokens = (leer('(a&b)').resultado as ExpresionLeida).tokens
          const arbol_maybe = arbol(tokens, {error: false, resultado: new Nodo<Token>()})

          arbol_maybe.error.should.equal(false)

          const raiz = arbol_maybe.resultado as Nodo<Token>

          raiz.contenido.should.equal(tokens.get(2))
          
          raiz.izquierda.contenido.should.equal(tokens.get(1))
          should.assert(raiz.izquierda.izquierda == null, 'La rama izquierda no es null')
          should.assert(raiz.izquierda.derecha == null, 'La rama derecha no es null')

          raiz.derecha.contenido.should.equal(tokens.get(3))
          should.assert(raiz.derecha.izquierda == null, 'La rama izquierda no es null')
          should.assert(raiz.derecha.derecha == null, 'La rama derecha no es null')
      })

      it('detecta un parentesis abierto', () => {
          const tokens = (leer('(a&b').resultado as ExpresionLeida).tokens
          const arbol_maybe = arbol(tokens, {error: false, resultado: new Nodo<Token>()})

          arbol_maybe.error.should.equal(true)

          arbol_maybe.resultado.should.deepEqual({nombre: 'ParentesisAbierto', pos: 0})
      })

      it('detecta un parentesis extraviado', () => {
          const tokens = (leer('a&b)').resultado as ExpresionLeida).tokens
          const arbol_maybe = arbol(tokens, {error: false, resultado: new Nodo<Token>()})

          arbol_maybe.error.should.equal(true)

          arbol_maybe.resultado.should.deepEqual({nombre: 'ParentesisExtraviado', pos: 3})
      })
  })

  describe('rpn', () => {
      it('funciona', () => {
          const exp_maybe = rpn(leer('(a&b)'))

          exp_maybe.error.should.equal(false)

          const exp = exp_maybe.resultado as List<Token>

          exp.get(0).should.deepEqual({nombre: 'a', texto: 'a', tipo: 'var', pos: 1})
          exp.get(0).should.deepEqual({nombre: 'b', texto: 'b', tipo: 'var', pos: 3})
          exp.get(0).should.deepEqual({nombre: 'conjuncion', texto: '&', tipo: 'conectivo', pos: 2})
      })

      it('devuelve el error encontrado', () => {
          const exp_maybe = rpn(leer('(a&b'))

          exp_maybe.error.should.equal(true)
          exp_maybe.resultado.should.deepEqual({nombre: 'ParentesisAbierto', pos: 0})
      })
  })
})
