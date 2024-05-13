/* eslint-env mocha */
'use strict'

const { cleanDir, expect, startWebServer, trapAsyncError } = require('./harness')
const fsp = require('node:fs/promises')
const ospath = require('node:path')
const { name: packageName } = require('#package')

const FIXTURES_DIR = ospath.join(__dirname, 'fixtures')
const WORK_DIR = ospath.join(__dirname, 'work')

describe('playbook-conventions-extension', () => {
  const ext = require(packageName + '/playbook-conventions-extension')

  const createGeneratorContext = () => ({
    variables: {},
    once (eventName, fn) {
      this[eventName] = fn
    },
    require (request) {
      if (request === 'isomorphic-git') return createIsomorphicGitStub()
      return require(request)
    },
    updateVariables (updates) {
      Object.assign(this.variables, updates)
    },
  })

  let generatorContext

  beforeEach(() => {
    generatorContext = createGeneratorContext()
  })

  describe('bootstrap', () => {
    it('should be able to require extension', () => {
      expect(ext).to.be.instanceOf(Object)
      expect(ext.register).to.be.instanceOf(Function)
    })
  })

  describe('apply defaults', () => {
    it('no playbook', async() => {
      const playbook = {}
      ext.register.call(generatorContext)
      await generatorContext.playbookBuilt( { playbook } )
      expect(playbook).to.eql({
        site: {
          robots: 'allow'
        },
        git: {
          ensure_git_suffix: false
        },
        asciidoc: {
          attributes: {
            hide_uri_scheme: '@',
            tabs_sync_option: '@',
          }
        },
        urls: {
          latest_version_segment_strategy: 'redirect:to',
          latest_version_segment: '',
          redirect_facility: 'httpd',
        },
        runtime: {
          log: {
            failure_level: 'warn',
          }
        },
      })
    })

    it('does not override existing values', async() => {
      const playbook = {
        site: {
          url: 'https://docs.spring.io/spring-security/reference',
        }
      }
      ext.register.call(generatorContext)
      await generatorContext.playbookBuilt( { playbook } )
      expect(playbook).to.eql({
        site: {
          url: 'https://docs.spring.io/spring-security/reference',
          robots: 'allow',
        },
        git: {
          ensure_git_suffix: false,
        },
        asciidoc: {
          attributes: {
            hide_uri_scheme: '@',
            tabs_sync_option: '@',
          }
        },
        urls: {
          latest_version_segment_strategy: 'redirect:to',
          latest_version_segment: '',
          redirect_facility: 'httpd',
        },
      })
    })

    it('overrides default when specified in playbook', async() => {
      const playbook = {
        site: {
          robots: 'disallow',
        }
      }
      ext.register.call(generatorContext)
      await generatorContext.playbookBuilt( { playbook } )
      expect(playbook).to.eql({
        site: {
          robots: 'disallow',
        },
        git: {
          ensure_git_suffix: false,
        },
        asciidoc: {
          attributes: {
            hide_uri_scheme: '@',
            tabs_sync_option: '@',
          }
        },
        urls: {
          latest_version_segment_strategy: 'redirect:to',
          latest_version_segment: '',
          redirect_facility: 'httpd',
        },
      })
    })

    it('can remove child', async() => {
      const playbook = {
        site: {
          robots: ':!this:',
        }
      }
      ext.register.call(generatorContext)
      await generatorContext.playbookBuilt( { playbook } )
      expect(playbook).to.eql({
        site: {
        },
        git: {
          ensure_git_suffix: false,
        },
        asciidoc: {
          attributes: {
            hide_uri_scheme: '@',
            tabs_sync_option: '@',
          }
        },
        urls: {
          latest_version_segment_strategy: 'redirect:to',
          latest_version_segment: '',
          redirect_facility: 'httpd',
        },
        runtime: {
          log: {
            failure_level: 'warn',
          }
        },
      })
    })
  })
})
