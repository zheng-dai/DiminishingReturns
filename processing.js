function codeChar(c){
    switch(c) {
        case "A": return 0;
        case "C": return 1;
        case "D": return 2;
        case "E": return 3;
        case "F": return 4;
        case "G": return 5;
        case "H": return 6;
        case "I": return 7;
        case "K": return 8;
        case "L": return 9;
        case "M": return 10;
        case "N": return 11;
        case "P": return 12;
        case "Q": return 13;
        case "R": return 14;
        case "S": return 15;
        case "T": return 16;
        case "V": return 17;
        case "W": return 18;
        case "Y": return 19;
        default: return -1;
    }
}

function hasSequon(x){
    for (let i = 0; i < x.length-2; i++)
    {
        if ((x[i] == 'N') && ((x[i+2] == 'T') || (x[i+2] == 'S') || (x[i+2] == 'C')))
        {
            return true;
        }
    }
    return false;
}

function levenshtein(x1, x2)
{
    const grid = [];
    for (let i = 0; i < x2.length+1; i ++)
    {
        grid.push(i);
    }
    for (let i = 0; i < x1.length; i++)
    {
        let prev = grid[0];
        grid[0] = i+1;
        for (j = 1; j < x2.length+1; j++)
        {
            const score1 = grid[j-1];
            const score2 = grid[j];
            const temp = grid[j];
            if (x1[i] === x2[j-1]) grid[j] = Math.min(prev, score1+1, score2+1);
            else grid[j] = Math.min(prev, score1, score2) + 1;
            prev = temp;
        }
    }
    return grid[x2.length];
}

function processInputs(inputs, n, scorefunc){
    let kmers = {};

    for (let i = 0; i < inputs.length; i++)
    {
        let seqName = inputs[i][0];
        let s = inputs[i][1];
        for (let j = 0; j < s.length - n + 1; j++)
        {
            let key = s.substring(j, j+n);
            if (!(key in kmers))
            {
                kmers[key] = new Set();
            }
            kmers[key].add(seqName);
        }
    }
    let output = [];
    for (const [key, value] of Object.entries(kmers)) {
        let seqNames = [];
        for (const key of value.keys()) seqNames.push(key);
        output.push({
            kmer: key,
            scores: scorefunc(key),
            sources: seqNames,
            sequon: hasSequon(key),
            redundant: null,
            selfpeptide: scanForHuman(key),
        });
    }
    return output;
}

function calculateOneUtility(state, pvec)
{
    const marginal = state.getmarginal();
    let util = 0;
    for (let j = 0; j < state.population.length; j++)
    {
        for (let k = 0; k < marginal.length; k++)
        {
            util += marginal[k] * pvec[j] * state.distributions[j][k] * state.population[j];
        }
    }
    return util;
}

function calculateUtility(state)
{
    const utils = [];
    const marginal = state.getmarginal();

    for (let i = 0; i < state.kmers.length; i++)
    {
        const kmer = state.kmers[i];
        let util = 0;
        for (let j = 0; j < state.population.length; j++)
        {
            for (let k = 0; k < marginal.length; k++)
            {
                util += marginal[k] * kmer.scores[j] * state.distributions[j][k] * state.population[j];
            }
        }
        utils.push(util);
    }

    return utils;
    //const maxutil = Math.max(...utils)
    //if (maxutil <= 0) return utils;
    //else return utils.map((x) => x/maxutil);
}

function makeGlobalState(kmers, population, populationNames)
{
    const populationLength = population.length;
    const distrLength = 16;

    let distributions = [];
    for (let i = 0; i < populationLength; i++)
    {
        distributions.push([])
        for (let j = 0; j < distrLength; j++)
        {
            distributions[i].push(0);
        }
        distributions[i][0] = 1;
    }
    let marginalUtil = [];
    for (let i = 0; i < distrLength-1; i++)
    {
        if (i<5) marginalUtil.push(1);
        else marginalUtil.push(0);
    }

    let o = {};
    o.kmers = kmers;
    o.population = population;
    o.populationNames = populationNames;
    o.distributions = distributions;
    o.marginal = marginalUtil;
    o.getmarginal = () => {
        return o.marginal;
        let sum = 0;
        for (let i = 0; i < distrLength-1; i++) sum += o.marginal[i];
        return o.marginal.map((x) => x/sum);
    }
    o.updateDistr = (pvec) => {
        for (let i = 0; i < populationLength; i++)
        {
            let reg1 = 0;
            let reg2 = 0;
            for (let j = 0; j < distrLength-1; j++)
            {
                reg1 = reg2;
                reg2 = o.distributions[i][j] * pvec[i];
                o.distributions[i][j] = (o.distributions[i][j] * (1-pvec[i])) + reg1;
            }
            o.distributions[i][distrLength-1] = o.distributions[i][distrLength-1] + reg2;
        }
    };
    o.remove = (kmer) => {
        o.kmers = o.kmers.filter((x) => !(x.kmer === kmer));
    };
    return o;
}

// Produces mock values
function dummyFunc(kmer, popsize){
    let arr = [];
    for (let i = 0; i < popsize; i++)
    {
        arr.push(Math.random());
    }
    return arr
}

// Produces mock values
function mockPopulation(popsize){
    let arr = [];
    let arr2 = [];
    let sum = 0;
    for (let i = 0; i < popsize; i++)
    {
        const x = Math.random();
        sum += x;
        arr.push(x);
        arr2.push("2<br\>HLA-A02:0"+i+"<br\>HLA-B02:02<br\>HLA-C01:01")
    }
    for (let i = 0; i < popsize; i++)
    {
        arr[i] = arr[i]/sum;
    }
    arr.sort();
    arr.reverse();

    return [arr, arr2];
}

function applyModel(kmerInt, model){
    let total = 0;
    for (let i = 0; i < kmerInt.length; i++)
    {
        total += model[i][kmerInt[i]];
    }
    return Math.exp(total);
}

function binarySearch(arr, lower, upper, p)
{
    if (upper <= lower+1) return upper;
    const mid = Math.floor((lower + upper)/2);
    const v = arr[mid]
    if (p==v) return mid+1;
    else if (p < v) return binarySearch(arr, lower, mid, p);
    else return binarySearch(arr, mid, upper, p);
}

function calibrate(pexp, calicurve)
{
    //apply sigmoid first
    const p = pexp/(1+pexp);
    //run through calibration curve
    if (p <= calicurve[0][0]) return calicurve[1][0];
    if (p >= calicurve[0][calicurve[0].length-1]) return calicurve[1][calicurve[1].length-1];
    const i = binarySearch(calicurve[0], 0, calicurve[0].length-1, p);
    return calicurve[1][i];
}

function scinotb(x) {
    if (x > 0.1)
    {
        return x.toFixed(2);
    }
    for (let i = 0; i < 10; i++)
    {
        if (x.toFixed(2) < 1) x = x*10;
        else return (x.toFixed(2) + "e-" + i);
    }
    return ("0");
}

function calcMhc1(kmer){
    const kmerInt = [];
    for (let i = 0; i < kmer.length; i++) kmerInt.push(codeChar(kmer[i]));
    
    const alleleprob = [];
    for (let i = 0; i < global_mhcModels[0].length; i++)
    {
        const p = applyModel(kmerInt, global_mhcModels[0][i]);
        alleleprob.push(calibrate(p, globalData.mhc1calicurve));
    }

    const popProb = [];
    const poplist = globalData.mhc1population;
    for (let i = 0; i < poplist.length; i++)
    {
        const avec = poplist[i][1];
        let failprob = 1;
        for (let j = 0; j < avec.length; j++){
            failprob = failprob * (1- alleleprob[avec[j]] );
        }
        popProb.push(1-failprob);
    }
    
    return popProb;
}

function mhc1Population()
{
    const w = [];
    const nms = [];
    const poplist = globalData.mhc1population;
    const popnames = globalData.mhc1populationNames;
    for (let i = 0; i < poplist.length; i++)
    {
        w.push(poplist[i][0]);
        nms.push( scinotb(poplist[i][0]*100) + "% of population" + "<br\>" + popnames[poplist[i][2][0]] + "<br\>" +
        popnames[poplist[i][2][1]] + "<br\>" + popnames[poplist[i][2][2]]);
    }
    return [w, nms];
}

function calcMhc2(kmer){
    const kmerInt = [];
    for (let i = 0; i < kmer.length; i++) kmerInt.push(codeChar(kmer[i]));
    
    const alleleprob = [];
    for (let i = 0; i < global_mhcModels[1].length; i++)
    {
        let p = 0;
        for (let j = 0; j < 7; j++) p += applyModel(kmerInt, global_mhcModels[1][i][j]);
        alleleprob.push(calibrate(p, globalData.mhc2calicurve));
    }

    const popProb = [];
    const poplist = globalData.mhc2population;
    for (let i = 0; i < poplist.length; i++)
    {
        const avec = poplist[i][1];
        let failprob = 1;
        for (let j = 0; j < avec.length; j++){
            failprob = failprob * (1- alleleprob[avec[j]] );
        }
        popProb.push(1-failprob);
    }
    
    return popProb;
}

function mhc2Population()
{
    const w = [];
    const nms = [];
    const poplist = globalData.mhc2population;
    const popnames = globalData.mhc2populationNames;
    for (let i = 0; i < poplist.length; i++)
    {
        w.push(poplist[i][0]);
        nms.push( scinotb(poplist[i][0]*100) + "% of population" + "<br\>" + popnames[poplist[i][2][0]] + "<br\>" +
        popnames[poplist[i][2][1]] + "<br\>" + popnames[poplist[i][2][2]]);
    }
    return [w, nms];
}