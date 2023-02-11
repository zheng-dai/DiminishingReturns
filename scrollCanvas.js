var infocardSpan = document.getElementById("infocardSpan");
var infocardPlate = document.getElementById("infocardPlate");
var infocardData = document.getElementById("infocardData");

function updateInfoCard(scrollObj)
{
    if (scrollObj.selected === -1) return;
    if (scrollObj.selected === null)
    {
        infocardPlate.style.backgroundColor = "rgb(64,64,64)";
        //infocardPlate.style.backgroundColor = "silver";
        infocardSpan.innerHTML = "<br\>";
        infocardData.innerHTML = "<br\><br\><br\>";
    }
    else
    {
        const sel = scrollObj.selected;
        let infot = ""
        let lines = 0
        if (sel.sequon){
            infot += "Glycosylation sequon present in sequence.<br\>";
            lines += 1;
        }
        if (!(sel.redundant === null))
        {
            infot += "Sequence is similar to " + sel.redundant + ", which is already included in the design.<br\>";
            lines += 1;
        }
        if (sel.selfpeptide)
        {
            infot += "Self peptide detected.<br\>";
            lines += 1;
        }
        for (let i = lines; i < 3; i++) infot += "<br\>";
        
        //if (lines === 0) infocardPlate.style.backgroundColor = "rgb(192,192,255)";
        //else infocardPlate.style.backgroundColor = "rgb(255, 128, 128)";
        if (lines === 0) infocardPlate.style.backgroundColor = "rgb(128,128,255)";
        else infocardPlate.style.backgroundColor = "rgb(255, 64, 64)";
        infocardSpan.innerHTML = scrollObj.selected.title;
        if (lines === 0) infocardData.innerHTML = "Sequence is OK.<br\><br\><br\>";
        else infocardData.innerHTML = infot;
    }
}

function clickElement(scrollObj, mousey)
{
    if (scrollObj.selected == -1) return;
    const entryheight = scrollObj.entryheight;
    const yoffset = -scrollObj.y;
    for (let i = scrollObj.elements.length-1; i >= 0; i--)
    {
        const y = (scrollObj.elements.length - 1 - i)*entryheight + yoffset;
        if ((y+entryheight > mousey) && (y < mousey))
        {
            if (scrollObj.selected === scrollObj.elements[i]) scrollObj.selected = null;
            else scrollObj.selected = scrollObj.elements[i];
            scrollObj.draw2();
            return;
        }
    }
}

function getScrollbarY(canvas, scrollObj) {
    const height = canvas.height;
    const maxoffset = Math.max( (scrollObj.elements.length * scrollObj.entryheight) - height, 0 );
    if (maxoffset == 0) return [0, height];
    else {
        const barh = height * height/(maxoffset + height);
        const barheight = Math.max( 1, barh );
        const pos = (height-barh) * scrollObj.y/maxoffset;
        return [pos, barheight]
    }
}

function scinot(x) {
    for (let i = 0; i < 10; i++)
    {
        if (x.toFixed(2) < 1) x = x*10;
        else return (x.toFixed(2) + "e-" + i);
    }
    return ("0.00e-0");
}

function drawScroll(ctx, canvas, scrollObj) {
    const entryheight = scrollObj.entryheight;
    const width = canvas.width;
    const height = canvas.height;

    const maxoffset = Math.max( (scrollObj.elements.length * entryheight) - height, 0 );
    if (scrollObj.y < 0) scrollObj.y = 0;
    if (scrollObj.y > maxoffset) scrollObj.y = maxoffset;
    const yoffset = -scrollObj.y;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    if (scrollObj.selected === -1) ctx.textAlign = "center";
    else ctx.textAlign = "start";
    for (let i = scrollObj.elements.length-1; i >= 0; i--)
    {
        const y = (scrollObj.elements.length - 1 - i)*entryheight + yoffset;
        if ((y+entryheight > 0) && (y < height))
        {
            if (i%2 == 0) ctx.fillStyle = "rgb(220,220,220)";
            else ctx.fillStyle = "rgb(235,235,235)";
            if (scrollObj.elements[i] === scrollObj.selected){
                const sel = scrollObj.selected;
                if (sel.sequon || !(sel.redundant === null) || sel.selfpeptide) ctx.fillStyle = "rgb(255,128,128)";
                else ctx.fillStyle = "rgb(192, 192, 255)";
            }

            ctx.fillRect(0, y, width, entryheight);

            if (scrollObj.elements[i].sequon || !(scrollObj.elements[i].redundant === null) || scrollObj.elements[i].selfpeptide) ctx.fillStyle = "red";
            else ctx.fillStyle = "black";

            if (scrollObj.selected === -1)
            {
                ctx.font = "16px monospace";
                ctx.fillText(scrollObj.elements[i].title, width/2, y+24);
            }
            else
                {
                ctx.font = "16px monospace";
                ctx.fillText(scinot(scrollObj.elements[i].getscore()), 10, y+24)
                ctx.font = "14px monospace";
                ctx.fillText(scrollObj.elements[i].title, 96, y+22);
            }
        }
    }
    ctx.fillStyle = "grey";
    ctx.fillRect(width-scrollObj.scrollbarWidth, 0, scrollObj.scrollbarWidth, height);
    if (scrollObj.active) ctx.fillStyle = "white";
    else ctx.fillStyle = "black";
    const barPosition = getScrollbarY(canvas, scrollObj);
    ctx.fillRect(width-scrollObj.scrollbarWidth, barPosition[0], scrollObj.scrollbarWidth, barPosition[1]);

    if (!(scrollObj.selected === -1))
    {
        ctx.strokeStyle = "grey";
        ctx.beginPath();
        ctx.moveTo(88, 0);
        ctx.lineTo(88, Math.min(height, scrollObj.elements.length * entryheight));
        ctx.stroke();
    }

    updateInfoCard(scrollObj);
}

function getCanvasCoord (e, canvas) {
	const boundingBox = canvas.getBoundingClientRect();
    return [e.offsetX/boundingBox.width, e.offsetY/boundingBox.height];
}

function initScrollCanvas(ctx, canvas, scrollObj){
    canvas.onwheel = (e) => {
        e.preventDefault();
        if (processing || init) return;
        scrollObj.y += e.deltaY;
        drawScroll(ctx, canvas, scrollObj);
    };
    canvas.onmousedown = (e) => {
        if (processing || init) return;
        const coord = getCanvasCoord(e, canvas);
        if (coord[0] > (canvas.width-scrollObj.scrollbarWidth)/canvas.width)
        {
            const y = coord[1] * canvas.height;
            const scrolly = getScrollbarY(canvas, scrollObj);
            if (scrolly[1] >= canvas.height) return;
            if ((y < scrolly[0]) || (y > scrolly[0] + scrolly[1]))
            {
                const position = (y - (scrolly[1]/2))/(canvas.height - scrolly[1]);
                scrollObj.y = position * ((scrollObj.elements.length * scrollObj.entryheight) - canvas.height);
            }
            scrollObj.active = true;
            drawScroll(ctx, canvas, scrollObj);
            scrollObj.activeOffset = y-getScrollbarY(canvas, scrollObj)[0];
        }
        else
        {
            clickElement(scrollObj, coord[1] * canvas.height);
            drawScroll(ctx, canvas, scrollObj);
        }
    };
    canvas.onmousemove = (e) => {
        if (processing || init) return;
        if (scrollObj.active)
        {
            const scrolly = getScrollbarY(canvas, scrollObj);
            const y = (getCanvasCoord(e, canvas)[1] * canvas.height) - scrollObj.activeOffset;
            const position = y/(canvas.height - scrolly[1]);
            scrollObj.y = position * ((scrollObj.elements.length * scrollObj.entryheight) - canvas.height);
            drawScroll(ctx, canvas, scrollObj);
        }
    }
    canvas.onmouseup = () => {
        if (processing || init) return;
        scrollObj.active = false;
        drawScroll(ctx, canvas, scrollObj);
    };
    canvas.onmouseleave = (e) => {
        if (processing || init) return;
        if (scrollObj.active)
        {
            scrollObj.active = false;
            const y = getCanvasCoord(e, canvas)[1];
            if (y > 0.9) scrollObj.y = scrollObj.elements.length * scrollObj.entryheight; 
            if (y < 0.1) scrollObj.y = 0;
            drawScroll(ctx, canvas, scrollObj);
        }
    };
    drawScroll(ctx, canvas, scrollObj);
    return scrollObj;
}