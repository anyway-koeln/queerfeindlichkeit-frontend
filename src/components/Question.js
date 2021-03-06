import { useCallback, useEffect, useState, useRef } from 'react'
import useKeyPress from '../hooks/useKeyPress.js'
import computeHasValue from '../functions/computeHasValue.js'

import { IonButton } from '@ionic/react'

import { withLocalization, Localized } from './fluent/Localized.js'

import classes from './Question.module.css'
import GeoInput from './GeoInput.js'

let abc = 'abcdefghijklmnopqrstuvwxyz'
const ABC = abc.toUpperCase().split('')
abc = abc.split('')
const keys2listen = ['Escape', 'Enter', ...abc, ...ABC]

function Question({ fluentByObject, getString, _id, question, description, input = {}, defaultValue: defaultValueObject, onSubmit }) {
  const inputRef = useRef()
  const [hasValue, setHasValue] = useState(false)

  const defaultValue = !!defaultValueObject ? defaultValueObject.value : new Set()
  let firstDefaultValue = [...defaultValue]
  if (firstDefaultValue.length > 0) {
    firstDefaultValue = firstDefaultValue[0]
  } else {
    firstDefaultValue = null
  }
  const writeInDefaultValue = !!defaultValueObject ? defaultValueObject.write_in : null

  const [value, setValue] = useState(defaultValue)
  const [writeInValue, setWriteInValue] = useState(writeInDefaultValue)

  const [, setValueJSON] = useState(JSON.stringify([...value]))

  const setValueBoth = useCallback(newValue => {
    setValue(newValue)
    setValueJSON(JSON.stringify([...newValue]))
  }, [setValue, setValueJSON])

  const [writeInIsActive, setWriteInIsActive] = useState(false)

  let niceValue = value
  if (input.type === 'number') {
    niceValue = parseFloat([...value][0])
  } else if (input.type === 'short_text' || input.type === 'long_text') {
    niceValue = [...value][0] + ''
  } else if (input.type === 'choice') {
    niceValue = [...value]
  }

  useEffect(() => {
    const hasValueNew = computeHasValue(niceValue, {
      min: (typeof input.min === 'number' ? input.min : -Infinity),
      max: (typeof input.max === 'number' ? input.max : Infinity)
    })
    setHasValue(hasValueNew)
  }, [niceValue, input.type, input.min, input.max, setHasValue])

  useKeyPress(keys2listen, event => {
    if (event.key === 'Escape') {
      if (!!inputRef && !!inputRef.current) {
        inputRef.current.blur()
      }
    } if (
      event.key === 'Enter'
      && (!input.required || (input.required && hasValue))
    ) {
      if (input.type === 'choice' && hasValue) {
        onSubmit({
          _id,
          value,
          ...(computeHasValue(writeInValue) ? { write_in: writeInValue } : {})
        })
      } else if (
        input.type === 'number'
        || input.type === 'short_text'
        || (input.type === 'long_text' && !writeInIsActive)
      ) {
        onSubmit({ _id, value })
      }
    } else if (input.type === 'choice' && !writeInIsActive) {
      let index = abc.indexOf(event.key)
      if (index <= -1) {
        index = ABC.indexOf(event.key)
      }
      if (index >= 0 && input.options[index]) {
        const option = input.options[index]._id

        if (input.multiple === true) {
          const newValue = value
          if (newValue.has(option)) {
            newValue.delete(option)
          } else {
            newValue.add(option)
          }
          setValueBoth(newValue)
        } else {
          let oldValue = [...value]
          if (oldValue.length > 0) {
            oldValue = oldValue[0]
          } else {
            oldValue = null
          }

          const newValue = new Set()
          if (option !== oldValue) {
            newValue.add(option)
          }
          setValueBoth(newValue)

          if (!!onSubmit && option !== oldValue) {
            onSubmit({
              _id,
              value: newValue,
              ...(computeHasValue(writeInValue) ? { write_in: writeInValue } : {})
            })
          }
        }
      }
    }
  })

  const storeValue = useCallback(event => {
    const newValueSet = new Set()
    newValueSet.add(event.target.value)
    setValueBoth(newValueSet)
  }, [setValueBoth])

  const min = !!input ? input.min || -Infinity : -Infinity
  const max = !!input ? input.max || Infinity : Infinity
  const storeNumberValue = useCallback(event => {
    let newValue = parseFloat(event.target.value)
    if (isNaN(newValue)) {
      newValue = null
    } else {
      if (typeof min === 'number' && newValue < min) {
        newValue = min
      } else if (typeof max === 'number' && newValue > max) {
        newValue = max
      }
    }

    const newValueSet = new Set()
    newValueSet.add(newValue)
    setValueBoth(newValueSet)
  }, [setValueBoth, min, max])

  const storeGeoValue = useCallback(value => {
    const newValueSet = new Set()
    if (!!value) {
      newValueSet.add(value)
    }
    setValueBoth(newValueSet)
  }, [setValueBoth])

  // START write in
  const storeWriteInValue = useCallback(event => {
    let option = event.target.value

    if (input.type === 'number' && option !== '') {
      option = parseFloat(option)
      if (isNaN(option)) {
        option = null
      }
    }

    if (input.multiple === true) {
      const newValue = value
      newValue.delete(writeInValue) // delete old value
      if (newValue.has(option)) {
        newValue.delete(option)
      } else if (option !== '') {
        newValue.add(option)
      }
      setValueBoth(newValue)
    } else {
      const newValue = new Set()
      if (option !== '') {
        newValue.add(option)
      }
      setValueBoth(newValue)
    }

    setWriteInValue(option)
  }, [input.type, input.multiple, value, writeInValue, setValueBoth, setWriteInValue])

  const handleWriteInFocus = useCallback(() => {
    setWriteInIsActive(true)
  }, [setWriteInIsActive])

  const handleWriteInBlur = useCallback(() => {
    setWriteInIsActive(false)
  }, [setWriteInIsActive])
  // END write in

  const handleChoiceClick = useCallback(option => {
    if (input.multiple === true) {
      const newValue = value
      if (newValue.has(option)) {
        newValue.delete(option)
      } else {
        newValue.add(option)
      }
      setValueBoth(newValue)
    } else {
      let oldValue = [...value]
      if (oldValue.length > 0) {
        oldValue = oldValue[0]
      } else {
        oldValue = null
      }

      const newValue = new Set()
      if (option !== oldValue) {
        newValue.add(option)
      }
      setValueBoth(newValue)

      if (!!onSubmit && option !== oldValue) {
        onSubmit({
          _id,
          value: newValue,
          ...(computeHasValue(writeInValue) ? { write_in: writeInValue } : {})
        })
      }
    }
  }, [value, setValueBoth, onSubmit, input.multiple, _id, writeInValue])

  const handleSubmit = useCallback(() => {
    if (!!onSubmit && (!input.required || (input.required && hasValue))) {
      onSubmit({
        _id,
        value,
        ...(computeHasValue(writeInValue) ? { write_in: writeInValue } : {})
      })
    }
  }, [input, hasValue, onSubmit, _id, value, writeInValue])

  // auto focus input field
  useEffect(() => {
    // if (input.type !== 'choice' && !!inputRef && !!inputRef.current && !hasValue) {
    //   inputRef.current.focus()
    // }
  }, [input.type, inputRef, hasValue])

  // do nothing if no question supplied
  if (!(!!_id)) {
    return null
  }

  let input_component = null
  if (input.type === 'number') {
    input_component = <input ref={inputRef} type="number" placeholder={getString('placeholder_number')} min={input.min || -Infinity} max={input.max || Infinity} onChange={storeNumberValue} defaultValue={firstDefaultValue} />
  } else if (input.type === 'short_text' || input.type === 'date') { // TODO: date sollte ein eigenes echtes input sein, das direkt überprüft, ob es ein echtes Datum ist.
    input_component = <input ref={inputRef} type="text" placeholder={getString('placeholder_short_text')} onChange={storeValue} defaultValue={firstDefaultValue} />
  } else if (input.type === 'long_text') {
    input_component = <textarea
      ref={inputRef}
      onChange={storeValue}
      onFocus={handleWriteInFocus}
      onBlur={handleWriteInBlur}
      defaultValue={firstDefaultValue}
      placeholder={getString('placeholder_long_text')}
    />
  } else if (input.type === 'choice') {
    input_component = <>
      {
        !!input.options
          ? input.options.map((option, index) => {
            const thisOption = fluentByObject(option)

            let title = null
            let description = null

            if (typeof thisOption === 'string' || thisOption instanceof String) {
              title = thisOption
            } else {
              if (!!thisOption.title) {
                title = thisOption.title
              }
              if (!!thisOption.description) {
                description = thisOption.description
              }
            }

            if (title === null) {
              return null
            }

            return <div
                key={option._id}
                className="body2"
                style={{ whiteSpace: 'nowrap', display: 'flex', marginBottom: '8px' }}
              >
              <span className={classes.button_key}>
                {ABC[index]}
              </span>
              <p className="body2" style={{ whiteSpace: 'normal', margin: '0' }}>
                <IonButton
                  style={{ verticalAlign: 'middle', margin: '0 0 2px 0', fontWeight: 'bold' }}
                  fill={value.has(option._id) ? 'solid' : 'outline'}
                  size="small"
                  onClick={() => handleChoiceClick(option._id)}
                >
                  {title}
                </IonButton>
                {
                  description !== null
                  ? <span style={{ margin: '0 0 0 8px' }}>{description}</span>
                  : null
                }
              </p>
            </div>
          })
        : null
      }
      {
        !!input.write_in
          ? <div>
            <input
              ref={inputRef}
              type="text"
              placeholder={getString('placeholder_write_in_short_text')}
              onChange={storeWriteInValue}
              onFocus={handleWriteInFocus}
              onBlur={handleWriteInBlur}
              defaultValue={writeInDefaultValue}
            />
          </div>
        : null
      }
    </>
  } else if (input.type === 'geo') {
    console.log('value', value)
    input_component = <>
      <GeoInput onChange={storeGeoValue} defaultValue={firstDefaultValue} />
      {
        value.size > 0
        ? <p><Localized id="label_annonymized_coordinates" vars={{ latLngText: [...value][0] }} /></p>
        : null
      }
    </>
  }

  return (
    <div className={classes.question}>
      <h3 className="subtitle1">{fluentByObject(question)}</h3>
      {!!description ? fluentByObject(description, '').split('\n').filter(Boolean).map(line => <p key={line}>{line}</p>) : null}
      {input.required ? <p style={{ color: 'darkred', fontWeight: 'bold' }}><Localized id="required_question" /></p> : null}
      {input_component}
      {
        (hasValue || !input.required)
        && (input.type !== 'choice' || input.write_in === true)
          ? <p>
            <IonButton style={{ verticalAlign: 'middle', margin: '0 16px 0 0' }} size="default" onClick={handleSubmit}><Localized id="submit_question" /></IonButton>
            {
              (
                input.type === 'number'
                || input.type === 'short_text'
                || (input.type === 'long_text' && !writeInIsActive)
                || (input.type === 'choice' && input.write_in === true && hasValue)
              )
              && (!input.required || (input.required && hasValue))
              ? <span style={{ verticalAlign: 'middle' }}>
                <Localized id="press_enter_info" elems={{strong: <strong/>}} />
              </span>
              : null
            }
          </p>
          : null
      }
    </div>
  )
}

export default withLocalization(Question)
