const core = require('@actions/core');
const github = require('@actions/github');

function protectClientPayload(clientPayload, exceptAllowlist) {
    clientPayload = clientPayload || {}

    console.log('Protecting members from client_payload:')

    Object.keys(clientPayload)
        .filter(memberName => !exceptAllowlist.includes(memberName))
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

        let allowlist =
            (core.getInput('allowlist') || '').split(',').filter(n => n);

        protectClientPayload(github.context.payload.client_payload, allowlist)

    } else {
        console.log(`Ignoring ${github.context.eventName} event`)
    }

} catch (error) {
    core.setFailed(error.message);
}