import './stimulus_bootstrap.js';

import '/node_modules/@gouvfr/dsfr/dist/dsfr.css';
import "/node_modules/@gouvfr/dsfr/dist/utility/icons/icons.main.min.css";
import './styles/app.scss';
import axios from 'axios';

// JAVASCRIPTS
import "/node_modules/@gouvfr/dsfr/dist/dsfr/dsfr.module";

const AXIOS_HEADERS = {
    headers: {
        'Content-Type': 'application/merge-patch+json',
    }
};

[...document.getElementsByClassName('action_edit')].forEach(lien_editable => {
    // 
    lien_editable.addEventListener('click', voidEvent);
    lien_editable.addEventListener('dblclick', edit);

    function voidEvent(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function edit(e) {
        voidEvent(e);
        const target = e.target;
        const currentText = target.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.style.minWidth = '200px';
        input.id = target.id;
        input.dataset.href = target.href;
        target.replaceWith(input);
        input.focus();

        input.addEventListener('blur', onceEdited);
    }

    function onceEdited(e) {
        removeEventListener('blur', onceEdited);
        const //
            target = e.target,
            newText = target.value,
            newLink = document.createElement('a');
        newLink.className = 'action_edit';
        newLink.id = target.id;
        newLink.href = target.dataset.href;
        newLink.innerText = newText;
        newLink.addEventListener('click', voidEvent);
        newLink.addEventListener('dblclick', edit);
        target.replaceWith(newLink);
        const [, method, entity, id, attr] = target.id.split('_');
        axios[method](`/oukile/api/${entity}/${id}`, {
            [attr]: newText
        }, AXIOS_HEADERS);
    }
});
