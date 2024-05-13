'use strict'

module.exports.register = function ({ playbook } ) {

  this.once('playbookBuilt', async ({ playbook }) => {
    const playbookBuilder = this.require('@antora/playbook-builder')
    const defaultPlaybook = {
      site: {
        robots: 'allow'
      },
      git: {
        ensureGitSuffix: false
      },
      asciidoc: {
        attributes: {
          'hide-uri-scheme': '@',
          'tabs-sync-option': '@',
        }
      },
      urls: {
        latestVersionSegmentStrategy: 'redirect:to',
        latestVersionSegment: '',
        redirectFacility: 'httpd',
      },
      runtime: {
        log: {
          failureLevel: 'warn',
        }
      },
      ui: {
        bundle: {
          url: 'https://github.com/spring-io/antora-ui-spring/releases/download/v0.4.11/ui-bundle.zip',
        },
      },
    }
    if (playbook?.runtime?.log?.failureLevel !== 'warn') {
      throw new Error('runtime.log.failure_level must be set to warn')
    }
    console.log(playbook)
    Object.assign(playbook, merge(playbook, playbookBuilder.defaultSchema, defaultPlaybook))
  })
}

function merge(current, schema, ...updates) {
  for (const update of updates) {
    for (const key of Object.keys(update)) {
      if (update[key] === ':!this:') delete current[key];
      else if (!current.hasOwnProperty(key) || (schema && schema.hasOwnProperty(key) && current[key] === schema[key].default) || typeof update[key] !== 'object') current[key] = update[key];
      else merge(current[key], schema ? schema[key] : schema, update[key]);
    }
  }
  return current;
}