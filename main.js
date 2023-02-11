var directInput = document.getElementById("inputSequence");
var candidateCanvas = document.getElementById("candidateCanvas");
var candidateCanvasCtx = candidateCanvas.getContext("2d");
var designCanvas = document.getElementById("designCanvas");
var designCanvasCtx = designCanvas.getContext("2d");
var overviewCanvas = document.getElementById("overviewCanvas");
var overviewCanvasCtx = overviewCanvas.getContext("2d");
var utilityCanvas = document.getElementById("utilityCanvas");
var utilityCanvasCtx = utilityCanvas.getContext("2d");
var distrCanvas = document.getElementById("distrCanvas");
var distrCanvasCtx = distrCanvas.getContext("2d");

var clipboardButton = document.getElementById("clipboardButton");
var scoreShowDesign = document.getElementById("scoreDisplay");

var global_levenshtein_parameter = 3;
var init = true;
var processing = true;

var slidecards = [];
for (let i = 1; i < 7; i++)
{
    slidecards.push(document.getElementById("card"+i));
}
function slideInCards()
{
    if (init)
    {
        for (let i = 0; i < 6; i++)
        {
            const element = slidecards[i];
            element.classList.remove("offsetLeft");
            element.classList.remove("offsetRight");
            element.classList.remove("offsetTop");
        }
        document.getElementById("design1").classList.remove("bkg2");
        document.getElementById("design2").classList.remove("truebkg3");
        //document.getElementById("bigcontainer").classList.remove("container2");
    }
}

var processstack = []
function startProcessing(){
    processing = true;
    processstack.push(1);
}

function endProcessing(){
    processstack.pop();
    if (processstack.length == 0)
    {
        processing = false;
    }
}

var candidateScroll = {
    elements: [],
    y: 0,
    entryheight: 32,
    active: false,
    activeOffset: 0,
    scrollbarWidth: 16,
    selected: null
}
/*for (let i = 0; i < 100; i++)
{
    candidateScroll.elements.push(
        {
            title: "ACGTAATAATAATAA",
            score: i/100,
            onClick: () => alert("Push")
        }
    )
}*/
var designScroll = {
    elements: [],
    y: 0,
    entryheight: 32,
    active: false,
    activeOffset: 0,
    scrollbarWidth: 16,
    selected: -1
}

// Not top level
function addToDesign()
{
    if (candidateScroll.selected != null)
    {
        designScroll.elements.push(candidateScroll.selected);
        if (designScroll.elements.length > 1)
        {
            clipboardButton.textContent = "Copy " + designScroll.elements.length + " peptides to clipboard";
        }
        candidateScroll.selected.onAdd();
        drawScroll(candidateCanvasCtx, candidateCanvas, candidateScroll);
        drawScroll(designCanvasCtx, designCanvas, designScroll);
    }
}

// Not top level
function forgetAllCandidateScores()
{
    for (let i = 0; i < candidateScroll.elements.length; i++)
    {
        candidateScroll.elements[i].score = null;
    }
    if (candidateScroll.selected != null) candidateScroll.selected.getscore();
    drawScroll(candidateCanvasCtx, candidateCanvas, candidateScroll);
}

// Not top level
var forgetOverviews = () => null;

function clipboardDesign()
{
    if (processing || init) return;
    if (!(designScroll.elements.length === 0))
    {
        let = text = "";
        for (let i = 0; i < designScroll.elements.length; i++)
        {
            if (text != "") text += ",";
            text += designScroll.elements[i].title;
        }
        navigator.clipboard.writeText(text);
    }
}

function initPage()
{
    processing = false;
    //alert("Page is loaded");
}

function compareKmerScore(a,b)
{
    let x1 = a.getscore();
    let x2 = b.getscore();
    if (a.sequon || !(a.redundant === null) || a.selfpeptide) x1 -= 1000;
    if (b.sequon || !(b.redundant === null) || b.selfpeptide) x2 -= 1000;
    return x1-x2;
}

function compareKmerAlphabet(a,b)
{
    let x = 0;
    if (a.title < b.title) x = 1;
    if (a.title > b.title) x = -1;
    
    let x1 = 0;
    let x2 = 0;
    if (a.sequon || !(a.redundant === null) || a.selfpeptide) x1 -= 1000;
    if (b.sequon || !(b.redundant === null) || b.selfpeptide) x2 -= 1000;
    return x+x1-x2;
}

function sortCandidates(f)
{
    if (processing || init) return;
    startProcessing();
    candidateScroll.elements.sort(f);
    drawScroll(candidateCanvasCtx, candidateCanvas, candidateScroll);
    endProcessing()
}

function updateDesign(state, pvec, scrollObj, kmer)
{
    state.updateDistr(pvec);
    state.remove(kmer)
    for (let i = 0; i < state.kmers.length; i++){
        if (levenshtein(kmer, state.kmers[i].kmer) <= global_levenshtein_parameter) state.kmers[i].redundant = kmer;
    }

    const utilityScores = calculateUtility(state);
    forgetOverviews();

    scrollObj.elements = [];
    for (let i = 0; i < state.kmers.length; i++){
        const pvec = state.kmers[i].scores;
        const kmer = state.kmers[i].kmer;
        const scrollElement = {
            pvec : pvec,
            title: kmer,
            score: utilityScores[i],
            sequon: state.kmers[i].sequon,
            redundant: state.kmers[i].redundant,
            selfpeptide: state.kmers[i].selfpeptide,
            onAdd: () => {
                startProcessing();
                updateDesign(state, pvec, candidateScroll, kmer);
                scrollObj.draw2();
                endProcessing();
            }
        }
        scrollElement.getscore = () => 
        {
            if (scrollElement.score === null) {
                scrollElement.score = calculateOneUtility(state, pvec);
            }
            return scrollElement.score;
        }
        scrollObj.elements.push(scrollElement);
    }
    scrollObj.elements.sort( compareKmerScore );
    if (scrollObj.elements.length > 0) scrollObj.selected = scrollObj.elements[scrollObj.elements.length-1];
    else scrollObj.selected = null;
}

function textHasProblems(text)
{
    for (let i = 0; i < text.length; i++)
    {
        if (codeChar(text[i]) < 0) return true;
    }
    return false;
}

function uploadDirect(n, procfunc, getPopulation, lvparam, mhcload)
{
    if (processing) return;
    if (directInput.value.length < 9 && mhcload == 1)
    {
        alert("Sequence must be at least length 9 for Class I MHC design.");
        return;
    }if (directInput.value.length < 15 && mhcload == 2)
    {
        alert("Sequence must be at least length 15 for Class I MHC design.");
        return;
    }
    if (textHasProblems(directInput.value))
    {
        alert("Input sequence must consist of only the 20 letters of the amino acid alphabet (only ACDEFGHIKLMNPQRSTVWY)");
        return;
    }

    startProcessing();
    startLoadMhc("mhc"+mhcload+".png", mhcload, () => {
        clipboardButton.textContent = "Copy to clipboard";

        global_levenshtein_parameter = lvparam;
        const text = [["Input", directInput.value]];
        const kmers = processInputs(text, n, procfunc);
        const population = getPopulation(); // numbers, names
        uploadInput(kmers, population)
        endProcessing();
    });
}

function uploadInput(kmers, population)
{
    startProcessing();
    candidateScroll = {
        elements: [],
        y: 0,
        entryheight: 32,
        active: false,
        activeOffset: 0,
        scrollbarWidth: 16,
        selected: null,
        draw2 : () => {}
    }
    designScroll = {
        elements: [],
        y: 0,
        entryheight: 32,
        active: false,
        activeOffset: 0,
        scrollbarWidth: 16,
        selected: -1,
        draw2 : () => {}
    }

    //let text = directInput.value;
    //let kmers = processInputs([["Input", text]], 9, dummyFunc);
    //let population = mockPopulation(100); // numbers, names
    let state = makeGlobalState(kmers, population[0], population[1]);

    const utilityScores = calculateUtility(state);

    const scrollObj = candidateScroll;
    for (let i = 0; i < state.kmers.length; i++){
        const pvec = state.kmers[i].scores;
        const kmer = state.kmers[i].kmer;
        const scrollElement = {
            pvec : pvec,
            title: kmer,
            score: utilityScores[i],
            sequon: state.kmers[i].sequon,
            redundant: state.kmers[i].redundant,
            selfpeptide: state.kmers[i].selfpeptide,
            onAdd: () => {
                startProcessing();
                updateDesign(state, pvec, candidateScroll, kmer);
                scrollObj.draw2();
                endProcessing();
            }
        }
        scrollElement.getscore = () => 
        {
            if (scrollElement.score === null) {
                scrollElement.score = calculateOneUtility(state, pvec);
            }
            return scrollElement.score;
        }
        scrollObj.elements.push(scrollElement);
    }
    scrollObj.elements.sort( compareKmerScore );
    if (scrollObj.elements.length > 0) scrollObj.selected = scrollObj.elements[scrollObj.elements.length-1];
    else scrollObj.selected = null;

    initScrollCanvas(candidateCanvasCtx, candidateCanvas, candidateScroll);
    initScrollCanvas(designCanvasCtx, designCanvas, designScroll);
    initUtilityCanvas(state, utilityCanvas, utilityCanvasCtx);

    const hlaCanvasObjects = initHLACanvas(state, overviewCanvas, overviewCanvasCtx);
    initDistrCanvas(state, hlaCanvasObjects[1], candidateScroll, distrCanvas, distrCanvasCtx);
    forgetOverviews = () => {
        hlaCanvasObjects[0]();
    }

    slideInCards();
    init = false;

    endProcessing();
}
