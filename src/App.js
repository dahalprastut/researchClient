import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

import "./App.css";

function App() {
	const svgRef = useRef();

	var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
		height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
	var map = svg.append("g").attr("class", "map");
	const [data, setData] = useState([]);
	const [name, setName] = useState("");
	const [dataTwo, setDataTwo] = useState([]);
	const [dataThree, setDataThree] = useState([]);
	const [dataFour, setDataFour] = useState([]);
	const [dataFive, setDataFive] = useState([]);
	const [dataSix, setDataSix] = useState([]);
	const [dataSeven, setDataSeven] = useState([]);
	const [dataEight, setDataEight] = useState([]);
	const [dataNine, setDataNine] = useState([]);
	const [world, setWorld] = useState([]);
	const [asyncdata, setAsyncData] = useState([]);
	const [start, setStart] = useState(false);
	const [correctAnswers, setCorrectAnswers] = useState([]);
	const [allAnswers, setAllAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [selectedQuestion, setSelectedQuestion] = useState(0);
	const [completed, setCompleted] = useState(false);
	const [answer, setAnswer] = useState("");
	const [timer, setTimer] = useState(0);

	const finishStatusFromLocalStorage = localStorage.getItem("finish");
	const [finish, setFinish] = useState(finishStatusFromLocalStorage);

	useEffect(() => {
		const loadData = async () => {
			try {
				const [world, data, data2, data3, data4, data5, data6, data7, data8, data9] = await Promise.all([
					d3.json("./combined_america.json"),
					d3.json("./data.json"),
					d3.json("./data2.json"),
					d3.json("./data3.json"),
					d3.json("./data4.json"),
					d3.json("./data5.json"),
					d3.json("./data6.json"),
					d3.json("./data7.json"),
					d3.json("./data8.json"),
					d3.json("./data9.json"),
				]);
				// Your code to draw the map goes here
				setWorld(world);
				setAsyncData(data);
				setDataTwo(data2);
				setDataThree(data3);
				setDataFour(data4);
				setDataFive(data5);
				setDataSix(data6);
				setDataSeven(data7);
				setDataEight(data8);
				setDataNine(data9);
				// setData(data)
			} catch (error) {
				console.error("Oh dear, something went wrong: " + error);
			}
		};
		loadData();
	}, []);

	useEffect(() => {
		if (asyncdata.length > 0) {
			setQuestions(asyncdata[0].questions);

			// geoMercator projection
			var projection = d3
				.geoMercator() //d3.geoOrthographic()
				.scale(350)
				.translate([width / 2, height / 3]);

			// geoPath projection
			var path = d3.geoPath().projection(projection);

			var features = feature(world, world.objects.countries).features;
			const infoById = {};
			const countriesName = asyncdata[0].value.map((element) => {
				return element.name;
			});
			const newData = [...asyncdata[0].value];
			const color = d3.scaleThreshold().domain(asyncdata[0].domain).range(asyncdata[0].colors);

			newData.forEach((d) => {
				infoById[d.name] = {
					name: d?.name,
					title: d?.title || "",
					population: d?.population,
					label: d?.label,
				};
			});
			features.forEach((d) => {
				d.details = infoById[d.properties.name] ? infoById[d.properties.name] : {};
			});
			setData(features);
			map.append("g")
				.selectAll("path")
				.data(features)
				.enter()
				.append("path")
				.attr("name", function (d) {
					return d.properties.name;
				})
				.attr("id", function (d) {
					return d.id;
				})
				.attr("d", path)
				.style("fill", function (d) {
					return d.details && d.details.population ? color(d.details.population) : "#1e1e1e";
					// return "#D3D2CE";
				})
				.style("stroke", "#0A142D")
				.style("stroke-width", 0.6);

			map.append("g")
				.selectAll("text")
				.data(features)
				.enter()
				.append("text")
				.attr("x", function (d) {
					// You might need to adjust these coordinates based on your map projection
					return path.centroid(d)[0];
				})
				.attr("y", function (d) {
					// You might need to adjust these coordinates based on your map projection
					return path.centroid(d)[1];
				})
				.text(function (d) {
					// Display the label property of each feature
					return d.details.label ? d.details.label : null;
				})
				.attr("text-anchor", "middle") // or adjust as needed
				.attr("dy", ".35em") // or adjust as needed
				.style("font-size", "14px") // or adjust as needed
				.style("font-weight", "700") // or adjust as needed
				.style("fill", "#fff"); // or adjust as needed
		}
	}, [asyncdata]);

	useEffect(() => {
		let interval;

		if (start) {
			interval = setInterval(() => {
				setTimer((prevTimer) => prevTimer + 1);
			}, 1000);
		}

		return () => {
			clearInterval(interval);
		};
	}, [start]);

	const nextButton = () => {
		setAnswer("");

		// WE don't care about the time taken by the users for wrong answers do we?

		if (answer === questions[0].correctAnswer) {
			setCorrectAnswers([
				...correctAnswers,
				{ username: name, time: timer, givenAnswer: answer, ...questions[0] },
			]);
		}
		setAllAnswers([...allAnswers, { username: name, time: timer, givenAnswer: answer, ...questions[0] }]);
		setTimer(0);

		if (selectedQuestion >= 8) {
			localStorage.setItem("finish", true);
		}

		setSelectedQuestion(selectedQuestion + 1);
	};

	useEffect(() => {
		// if (selectedQuestion > 8) {
		// 	console.log("all answers", allAnswers);
		// 	console.log("correct answers", correctAnswers);
		// }
		if (selectedQuestion > 8) {
			const sendSurveyResults = async () => {
				try {
					const response = await fetch("https://researchserver.onrender.com/api/send-survey-results", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							allAnswers,
							correctAnswers,
						}),
					});

					if (response.ok) {
						console.log("Survey results sent successfully");
					} else {
						console.error("Failed to send survey results");
					}
				} catch (error) {
					console.error("Error sending survey results:", error);
				}
			};

			sendSurveyResults();
		}
	}, [allAnswers]);

	useEffect(() => {
		if (selectedQuestion === 1) {
			setAsyncData(dataTwo);
		} else if (selectedQuestion === 2) {
			setAsyncData(dataThree);
		} else if (selectedQuestion === 3) {
			setAsyncData(dataFour);
		} else if (selectedQuestion === 4) {
			setAsyncData(dataFive);
		} else if (selectedQuestion === 5) {
			setAsyncData(dataSix);
		} else if (selectedQuestion === 6) {
			setAsyncData(dataSeven);
		} else if (selectedQuestion === 7) {
			setAsyncData(dataEight);
		} else if (selectedQuestion === 8) {
			setAsyncData(dataNine);
		}
	}, [selectedQuestion]);

	const answersClicked = (e, el) => {
		setAnswer(el);
	};

	const clickStart = (val) => {
		setStart(val);
	};

	return (
		<div className="App">
			<div className="center">
				{start ? (
					<div className="index">
						<div className="highest">
							<span style={{ background: asyncdata[0]?.colors[asyncdata[0]?.colors?.length - 1] }}></span>
							<small>Highest</small>
						</div>
						<div className="lowest">
							<span style={{ background: asyncdata[0]?.colors[0] }}></span>
							<small>Lowest</small>
						</div>
					</div>
				) : null}
				<svg style={!start ? { display: "none" } : { display: "block" }} ref={svgRef}></svg>
				{!start ? (
					<>
						<div className="d-flex textbox">
							<input type="text" placeholder="Your name" onChange={(e) => setName(e.target.value)} />
						</div>
						<div className="questions start-questions">
							<ul className="question-section ul">
								Instructions:
								<li>
									Each of the regions of the map has a certain population value associated with it
								</li>
								<li>The left-top shows the index of the highest value and the lowest value color</li>
								<li>Based on the color difference, select the best answer and click next</li>
								<li>You will have a total of 9 questions</li>
								<li>Every question is timed so please answer as fast as you can</li>
							</ul>
							<div className="answer-section">
								<button
									onClick={() => {
										name.length > 0 ? clickStart(!start) : alert("Empty name");
									}}
								>
									Start
								</button>
							</div>
						</div>
					</>
				) : (
					<div className="questions">
						<div className="question-section">{questions[0].question}</div>
						<div className="answer-section">
							{questions[0].options.map((el) => (
								<button onClick={(e) => answersClicked(e, el)}>{el}</button>
							))}
						</div>
						<div className="next-btn">
							<button disabled={!answer.length > 0} onClick={nextButton}>
								{selectedQuestion < 8 ? "Next" : "Finish"}
							</button>
						</div>
					</div>
				)}
				{(selectedQuestion > 8 || finish) && (
					<div className="finish-model">
						<h1>Thank you for answering all the questions {name}</h1>
					</div>
				)}
			</div>
			{(selectedQuestion > 8 || finish) && <div className="model"></div>}
		</div>
	);
}

export default App;
