const core = require('@actions/core');
const github = require('@actions/github');

function protectClientPayload(clientPayload, exceptAllowlist) {
    clientPayload = clientPayload || {}

    console.log('Protecting members from client_payload:')

    recurseMembers(clientPayload,
        (val, memberName) => {
            if (exceptAllowlist.includes(memberName)) {
                return
            }

            core.info(`- protecting ${memberName}`)
            if (val) {
                core.setSecret(val.toString())
            }
        })
}

function recurseMembers(obj, memberCallback, path) {
    const members = Object.keys(obj)

    path = path || []

    for (let member of members) {
        const val = obj[member]
        const memberPath = [...path, member]
        if (typeof val === 'object') {
            recurseMembers(val, memberCallback, memberPath)
        } else {
            memberCallback(val, memberPath.join('.'))
        }
    }
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
