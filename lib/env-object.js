function setProperty(obj, namespace, value) {
  namespace = namespace.split('_')
  let result = {}
  let currentProperty = obj
  for (let n = 0; n < namespace.length; n++) {
    const propertyName = namespace[n]
    if (!currentProperty[propertyName]) {
      currentProperty[propertyName] = {}
    }
    if (n === namespace.length - 1) {
      currentProperty[propertyName] = value
    }
    currentProperty = currentProperty[propertyName]
  }
}

function envObject(environmentVariableName) {
  let result = null
  for (const envName in process.env) {
    if (process.env.hasOwnProperty(envName)) {
      if (envName.indexOf(environmentVariableName + '_') === 0) {
        if (result === null) {
          result = {}
        }
        let newValue
        try {
          newValue = parseInt(process.env[envName], 10)
          if (isNaN(newValue)) {
            newValue = process.env[envName]
          }
        } catch (error) {
          process.env[envName]
        }
        let envValue = newValue

        const namespace = envName.replace(environmentVariableName + '_', '')
        setProperty(result, namespace, envValue)
      }
    }
  }
  return result
}

module.exports = envObject