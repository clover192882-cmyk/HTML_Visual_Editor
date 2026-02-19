let state = {
    0:{
        "structures":{"name":"root", "tag":"div"},
        "attributes":{"id":"root"},
        "properties":{"width":"100vw", "height":"100vh"},
        "children":[1, 2, 3]
    },

    1:{
       "structures":{"name":"red box", "tag":"div", "textContent":"red"},
        "attributes":{"class":"sample", "id":"red-box"},
        "properties":{"width":"100px", "height":"100px", "backgroundColor":"red"},
        "children":[]
    },

    2:{
        "structures":{"name":"green box", "tag":"div", "textContent":"green"},
        "attributes":{"class":"sample", "id":"green-box"},
        "properties":{"width":"100px", "height":"100px", "backgroundColor":"green"},
        "children":[]
    },

    3:{
        "structures":{"name":"blue box", "tag":"div", "textContent":"blue"},
        "attributes":{"class":"sample", "id":"blue-box"},
        "properties":{"width":"100px", "height":"100px", "backgroundColor":"blue"},
        "children":[]
    }
}

let ui = {
    "state":{
        "size":Object.keys(state).length
    },

    "list":{
        "selected":null
    },

    "editor":{
        "blank":{
            "structures":{"name":"new form", "tag":"div"},
            "attributes":{},
            "properties":{"width":"100px", "height":"100px", "backgroundColor":"skyblue"},
            "children":[]
        }
    }
};

const sections = {
    stage:document.querySelector("#stage"),
    ui:document.querySelector("#ui")
};

const panels = {
    objectList:sections["ui"].querySelector("#object-list"),
    objectEditor:sections["ui"].querySelector("#object-editor")
};

const templates = {
    defaultPairForm:document.querySelector("#default-pair-form"),
    defaultSingleForm:document.querySelector("#default-single-form"),
    pairForm:document.querySelector("#pair-form"),
    singleForm:document.querySelector("#single-form")
};

function createNode(layer){
    const object = state[layer];
    const {structures, attributes, properties, children} = object;
    const {name, tag, ...rest} = structures;

    const element = document.createElement(tag);
    element.setAttribute("objectname", name);
    element.setAttribute("objectlayer", layer);

    Object.entries(rest).forEach(([key, value]) => element[key] = value);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    Object.entries(properties).forEach(([key, value]) => element.style[key] = value);
    children.forEach(child => {if(child) element.appendChild(createNode(child));});

    return element;
}

function renderNode(parent, layer){
    const prevNode = parent.querySelector(`[objectlayer="${layer}"]`);
    const currentNode = createNode(layer);

    if(prevNode){
        prevNode.replaceWith(currentNode);
    }else{
        parent.appendChild(currentNode);
    }
}

renderNode(sections.stage, 0);

function findLayer(name){
    let result = null;
    Object.entries(state).forEach(([key, value]) => {
        if(value.structures.name === name) result = key;
    });
    return result;
}

function renderObjectList(event){
    const innerPanel = panels.objectList.querySelectorAll(".inner-panel");
    innerPanel.forEach(panel => {panel.querySelectorAll(".sample").forEach(samples => {samples?.remove()});});

    const targetLayer = event.target.matches("[objectlayer]") ? event.target.getAttribute("objectlayer") : null;
    const targetChild = state[targetLayer].children;
    const items = [targetLayer, ...targetChild];

    if(items.length > 1){
        items.forEach((item, index) => {
            const sample = templates["defaultSingleForm"].content.cloneNode(true);
            const input = sample.querySelector(".input");
            input.textContent = state[item].structures.name;
            input.dataset.value = findLayer(input.textContent);

            if(index == 0){
                innerPanel[0].appendChild(sample);
            }else{
                innerPanel[1].appendChild(sample);
            }
        });

        panels.objectList.style.top = event.clientY + "px";
        panels.objectList.style.left = event.clientX + "px";
        panels.objectList.style.display = "flex";
        ui.list.selected = null;
    }else{
        panels.objectList.style.display = "none";
        ui.list.selected = targetLayer;
    }
}

function retrieveObjectItem(event){
    const targeted = event.target.matches(".input") ? event.target.dataset.value : null;
    ui.list.selected = targeted;
}

function renderObjectEditor(object){
    if(object){
        Object.entries(object).forEach(([mainKey, mainValue]) => {
            const innerPanel = panels.objectEditor.querySelector(`#${mainKey}`);
            innerPanel.querySelectorAll(".sample").forEach(samples => samples?.remove());

            if(mainKey != "children"){
                Object.entries(mainValue).forEach(([key, value]) => {
                    let sample = templates.pairForm.content.cloneNode(true);

                    if(key === "name" || key === "tag"){
                        sample = templates.defaultPairForm.content.cloneNode(true);
                    }

                    const [keys, values] = sample.querySelectorAll(".input");
                    keys.textContent = key;
                    values.textContent = value;
                    innerPanel.appendChild(sample);
                });
            }else{
                mainValue.forEach(item => {
                    const sample = templates.singleForm.content.cloneNode(true);
                    const input = sample.querySelector(".input");
                    input.textContent = state[item].structures.name;
                    input.dataset.value = item;
                    input.dataset.original = item;
                    innerPanel.appendChild(sample);
                });
            }
        });

        panels.objectEditor.style.right = "20px";
    }else{
        panels.objectEditor.style.right = "-370px";
    }
}

function retrieveEditorForm(){
    const innerPanel = panels.objectEditor.querySelectorAll(".inner-panel");
    const result = {"children":[]};

    innerPanel.forEach(panel => {
        const samples = panel.querySelectorAll(".sample");
        const pass = {};

        if(panel.id != "children"){
            Object.assign(result, {[panel.id]:pass});
            samples.forEach(sample => {
                [key, value] = sample.querySelectorAll(".input");

                const keyContent = key.textContent.trim();
                const valueContent = value.textContent.trim()

                Object.assign(pass, {[keyContent]:valueContent});
            });
        }else{
            samples.forEach(sample => {
                const value = sample.querySelector(".input");
                const layer = findLayer(value.textContent);
                
                if(layer !== null){
                    value.dataset.value = layer;
                    value.dataset.original = layer;
                }else{
                    value.dataset.value = value.dataset.original;
                }

                const finalLayer = value.dataset.value;

                if(finalLayer !== undefined && state[finalLayer]){
                    result.children.push(finalLayer);
                }
            });
        }
    });

    return result;
}

function commitEditor(){
    state[ui.list.selected] = retrieveEditorForm();
    const parent = document.querySelector(`[objectlayer="${ui.list.selected}"]`)?.parentElement;
    renderNode(parent, ui.list.selected);
}

function addSample(button, type){
    let sample = templates.pairForm.content.cloneNode(true);
    if(type == 1) sample = templates.singleForm.content.cloneNode(true);
    const panel = button.closest(".inner-panel");
    panel.appendChild(sample);
}

function deleteSample(button){
    button.closest(".sample").remove();
    commitEditor();
}

sections.stage.addEventListener("click", event => {
    renderObjectList(event);
    renderObjectEditor(state[ui.list.selected]);
});

panels.objectList.addEventListener("click", event => {
    retrieveObjectItem(event);
    renderObjectEditor(state[ui.list.selected]);
});

panels.objectEditor.addEventListener("input", () => {
    commitEditor();
});