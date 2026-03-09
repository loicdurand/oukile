import './stimulus_bootstrap.js';

import '/node_modules/@gouvfr/dsfr/dist/dsfr.css';
import "/node_modules/@gouvfr/dsfr/dist/utility/icons/icons.main.min.css";
import './styles/app.scss';
import axios from 'axios';
import { onReady } from './javascripts/utils/document.ts';

// JAVASCRIPTS
import "/node_modules/@gouvfr/dsfr/dist/dsfr/dsfr.module";

const AXIOS_HEADERS = {
    headers: {
        'Content-Type': 'application/merge-patch+json',
    }
};

onReady('.action_edit').then(() => {

    [...document.getElementsByClassName('action_edit')].forEach(lien_editable => {
        lien_editable.addEventListener('click', voidEvent);
        lien_editable.addEventListener('dblclick', edit);
    });

});

function edit(e) {
    voidEvent(e);
    const // 
        target = e.target,
        currentText = target.innerText,
        deletebtn_id = target.dataset.deletebtn,
        deletebtn = document.getElementById(deletebtn_id),
        message_id = target.dataset.message,
        input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.style.minWidth = '200px';
    input.id = target.id;
    input.dataset.href = target.href;
    input.dataset.value = currentText;
    input.dataset.deletebtn = deletebtn_id;
    input.dataset.message = message_id;

    target.replaceWith(input);
    input.focus();

    input.addEventListener('blur', onceEdited);
    deletebtn.classList.remove('fr-hidden');
}

function onceEdited(e) {
    removeEventListener('blur', onceEdited);
    setTimeout(async () => {
        const //
            target = e.target,
            oldText = e.target.dataset.value,
            newText = target.value,
            newLink = document.createElement('a'),
            deletebtn_id = target.dataset.deletebtn,
            deletebtn = document.getElementById(deletebtn_id),
            message_id = target.dataset.message,
            successmessage = document.getElementById(`success-${message_id}`),
            errormessage = document.getElementById(`error-${message_id}`);
        newLink.className = 'action_edit';
        newLink.id = target.id;
        newLink.href = target.dataset.href;
        newLink.innerText = newText;
        newLink.dataset.deletebtn = deletebtn_id;
        newLink.dataset.message = message_id;
        newLink.addEventListener('click', voidEvent);
        newLink.addEventListener('dblclick', edit);
        target.replaceWith(newLink);
        if (oldText === newText)
            return deletebtn.classList.add('fr-hidden');
        const [, method, entity, id, attr] = target.id.split('_');
        axios[method](`/oukile/api/${entity}/${id}`, {
            [attr]: newText
        }, AXIOS_HEADERS)
            .then(() => showMessage(successmessage))
            .catch(() => showMessage(errormessage))
            .finally(() => {
                setTimeout(() => {
                    deletebtn.classList.add('fr-hidden');
                }, 120);
            });


    }, 400);

}

function voidEvent(e) {
    e.preventDefault();
    e.stopPropagation();
}

function showMessage(element) {
    element.classList.remove('fr-hidden');
    element.classList.remove('cs-hide');
    setTimeout(() => {
        element.classList.add('cs-hide');
        setTimeout(() => {
            element.classList.add('fr-hidden');
            element.classList.remove('cs-hide');
        }, 500);
    }, 2000);
}
