const core = require('@actions/core');
const github = require('@actions/github');

function protectClientPayload(clientPayload, exceptWhitelist) {
    clientPayload = clientPayload || {}

    console.log('Protecting members from client_payload:')

    Object.keys(clientPayload)
        .filter(memberName => !exceptWhitelist.includes(memberName))
        .forEach(memberName => {
            core.info(`- protecting ${memberName}`)

            let val = clientPayload[memberName]

            if (val) {
                val = val.toString()
                core.setSecret(val)
            }
        })
}

try {
    if (github.context.eventName === 'repository_dispatch') {

        let whitelist =
            (core.getInput('whitelist') || '').split(',').filter(n => n);

        protectClientPayload(github.context.payload.client_payload, whitelist)

    } else {
        console.log(`Ignoring ${github.context.eventName} event`)
    }

} catch (error) {
    core.setFailed(error.message);
}