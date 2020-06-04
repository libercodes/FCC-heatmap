const colorPalette = {
    RdYlBu: {
      3: ["#fc8d59","#ffffbf","#91bfdb"],
      4: ["#d7191c","#fdae61","#abd9e9","#2c7bb6"],
      5: ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"],
      6: ["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"],
      7: ["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"],
      8: ["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],
      9: ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"],
      10: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"],
      11: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]
    },
    RdBu: {
      3: ["#ef8a62","#f7f7f7","#67a9cf"],
      4: ["#ca0020","#f4a582","#92c5de","#0571b0"],
      5: ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"],
      6: ["#b2182b","#ef8a62","#fddbc7","#d1e5f0","#67a9cf","#2166ac"],
      7: ["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"],
      8: ["#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
      9: ["#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
      10: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"],
      11: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"]
    }
  };




const margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
}
const fontSize = 16;
const padding = {
    left: 9*fontSize, 
    right: 9*fontSize, 
    top: 1*fontSize, 
    bottom:8*fontSize
};
const svgHeight = 800 - margin.top - margin.bottom
const svgWidth = 1500 - margin.left - margin.right


const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
const translateX = 50


let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);


let baseTemp;
const fetchData = async() => {
    const response = await fetch(url)
    const data = await response.json()
    console.log(data.monthlyVariance)
    baseTemp = data.baseTemperature
    return data;
}



fetchData().then(list => {
    const width = 5*Math.ceil(list.monthlyVariance.length/12)
    const height = 400
    const barHeight = svgHeight /12

    const svg = d3.select('.scatterplot')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
    
    //Escala en x
    const xScale = d3.scaleBand()
        .rangeRound([0, width], 0, 0)
        .domain(list.monthlyVariance.map( d => d.year))
    
    //Eje x
    const xAxis = d3.axisBottom()
        .scale(xScale)
        //mostrar ticks cada 10 anios.
        .tickValues(xScale.domain().filter(year => year % 10 === 0))
        .tickFormat(year => {
            let date = new Date(0)
            date.setUTCFullYear(year+1)
            const format = d3.timeFormat('%Y')
            return format(date)
        })
        .tickSize(10,1)

    //Escala en y
    const yScale = d3.scaleBand()
        .rangeRound([0, height-30], 0, 0)
        .domain([0,1,2,3,4,5,6,7,8,9,10,11])

    //Eje y
    const yAxis  = d3.axisLeft().scale(yScale).ticks(12)
    
    //Renderiza el eje x
    svg.append('g')
            .attr('transform', `translate(${translateX},${height-20})`)
            .call(xAxis)
        
    //Renderiza el eje y
    svg.append('g')
        .attr('transform', `translate(${translateX},10)`)
        .call(yAxis)

        
    const legendColors = colorPalette.RdYlBu[11].reverse();
    const legendHeight = 300/legendColors.length;
    const variance = list.monthlyVariance.map(d => d.variance)
    const minTemp = list.baseTemperature + Math.min.apply(null, variance)
    const maxTemp = list.baseTemperature + Math.max.apply(null, variance)
    const legendThreshold = d3.scaleThreshold()
        .domain(((min, max, count) => {
            let arr = []
            let step = (max-min)/count
            let base = min
            for(let i  = 1; i < count; i++){
                arr.push(base + i*step)
            }
            return arr
        })(minTemp,maxTemp,legendColors.length))
        .range(legendColors)

    const legendX = d3.scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, 400])
    
    const xAxisLegendX = d3.axisBottom()
        .scale(legendX)
        .tickValues(legendThreshold.domain())
        .tickFormat(d3.format('.1f'))

    const legend = svg.append('g')
        .classed('legend', true)
        .attr('id', 'legend')
        .attr('transform', `translate(${padding.left}, ${padding.top + height + padding.bottom - 2*legendHeight})`)

    //rendering legend scale
    legend.append('g')
        .selectAll('rect')
        .data(legendThreshold.range().map(color => {
            let d = legendThreshold.invertExtent(color)
            if(d[0] == null) d[0] = legendX.domain()[0]
            if(d[1] == null) d[1] = legendX.domain()[1]
            return d
        }))
        .enter()
        .append('rect')
        .style('fill', (d, i) => legendThreshold(d[0]))
        .attr('x', (d,i) => legendX(d[0]))
        .attr('y', 0)
        .attr('width', (d, i) => legendX(d[1]) - legendX(d[0]))
        .attr('height', legendHeight)

    legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(xAxisLegendX)



    //map temperatures
    svg.append('g')
        .classed("map", true)
        .attr('transform', `translate(${translateX}, ${padding.top})`)
        .selectAll('rect')
        .data(list.monthlyVariance)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('data-mont', d => d.month)
        .attr('data-year', d => d.year)
        .attr('data-temp', d => list.baseTemperature + d.variance)
        .attr('x', (d,i) => xScale(d.year))
        .attr('y', (d,i) => yScale(d.month))
        .attr('width', (d,i) => xScale.bandwidth())
        .attr('height', (d,i) => yScale.bandwidth())
        .attr('fill', (d,i) => legendThreshold(list.baseTemperature + d.variance))
        .on('mouseover', d => {
            tooltip.style('opacity', .9)
            let date = new Date(d.year, d.month)
            tooltip.html(`
                <span class='date'> ${d3.timeFormat('%Y - %B')(date)} </date>
                <br/>
                <span class='temperature'> 
                    ${d3.format('.1f')(list.baseTemperature + d.variance)}
                </span>
                </br>
                <span class='variance'>
                    ${d3.format('.1f')(d.variance)}
                </span>
            `)
            .style('left', `${d3.event.pageX+ 5}px`)
            .style('top', `${d3.event.pageY - 28}px`)
            tooltip.attr("data-year", d.year);
        })
        .on('mouseout', d => tooltip.style('opacity', 0))
        
})