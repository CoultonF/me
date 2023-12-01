import React, { useRef, useLayoutEffect, useEffect } from "react";
import * as d3 from "d3";
import glucose from "../data/cbg.json";

interface TimeSeriesData {
  date: Date;
  value: number;
}

export const Chart = () => {

  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (chartRef.current !== null && chartRef.current !== undefined)
    {
    const svg = d3.select(chartRef.current);

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = chartRef.current?.parentElement?.clientWidth || 0;
    const height = chartRef.current?.parentElement?.clientHeight || 0;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const data = glucose.map((d) => ({
      date: new Date(d.time),
      value: d.value,
    }));
    const max = data.reduce(function (prev, current) {
      return prev.value > current.value ? prev : current;
    }).value; //returns object

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, max <= 16.6 ? 16.6 : 22.2])
      .range([innerHeight, 0]);

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value));

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("rect")
      .attr("class", "range-background")
      .attr("x", 0)
      .attr("y", yScale(max <= 16.6 ? 16.6 : 22.2))
      .attr("width", innerWidth)
      .attr("height", yScale(10.1) - yScale(max <= 16.6 ? 16.6 : 22.2))
      .classed("fill-yellow-200 opacity-[.20]", true);
    g.append("rect")
      .attr("class", "range-background")
      .attr("x", 0)
      .attr("y", yScale(3.9))
      .attr("width", innerWidth)
      .attr("height", yScale(0) - yScale(3.9))
      .classed("fill-red-200 opacity-[.40]", true);
    g.append("rect")
      .attr("class", "range-background")
      .attr("x", 0)
      .attr("y", yScale(10))
      .attr("width", innerWidth)
      .attr("height", yScale(4) - yScale(10))
      .classed("fill-lime-900 opacity-[.15]", true);

    // g.append("path").datum(data).attr("d", line);
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 3)
      .classed("dotted fill-black", true);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("transform", "rotate(-45)");

    g.append("g").call(d3.axisLeft(yScale));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text("Blood Glucose (mmol/L)");
    }
  }, []);

  return (
    <div className="w-auto h-96 m-10">
      <h3 className="text-2xl font-semibold leading-6 text-gray-900 text-center">
        Blood Glucose Data
      </h3>
      <p className="text-sm text-center">Past 24 Hours</p>
      <svg ref={chartRef} className="w-full h-full"></svg>
    </div>
  );
};
