// CIE 1931 color functions
function g(x, mu, tau_1, tau_2){
	if( x < mu){
		return Math.exp(-tau_1*tau_1* Math.pow(x-mu, 2)/2);
	}
	return Math.exp(-0.5*tau_2*tau_2*(x-mu)*(x-mu));
}

function x_bar(lambda){
	return 1.056*g(lambda, 599.8, 0.0264, 0.0323) + 0.362*g(lambda, 442.0, 0.0624, 0.0374) -0.065*g(lambda, 501.1, 0.0490, 0.0382);
}
function y_bar(lambda){
	return 0.821*g(lambda, 568.8, 0.0213, 0.0247) + 0.286*g(lambda, 530.9, 0.0613, 0.0322);
}
function z_bar(lambda){
	return 1.217*g(lambda, 437.0, 0.0845, 0.0278) + 0.681*g(lambda, 459.0, 0.0385, 0.0725);
}

function XYZ_from_wavelength(lambda){
	const X = x_bar(lambda);
	const Y = y_bar(lambda);
	const Z = z_bar(lambda);
	return [X,Y,Z];
}

function xyY_from_wavelength(lambda){
	const X = x_bar(lambda);
	const Y = y_bar(lambda);
	const Z = z_bar(lambda);
	const x = X / (X+Y+Z);
	const y = Y / (X+Y+Z);
	return [x, y, Y];
}

function sRGB_gamma_correction(C){
	if( C > 0.0031308 ){
		return (1.055 * Math.pow(C, 1/2.4)) - 0.055;
	}else{
		return 12.92*C;
	}
}

function XYZ_to_sRGB(X, Y, Z){
	const r_lin =  3.2406255*X -1.5372080*Y -0.4986286*Z;
	const g_lin = -0.9689307*X +1.8757561*Y +0.0415175*Z;
	const b_lin =  0.0557101*X -0.2040211*Y +1.0569959*Z;
//	const r_norm = r_lin/Math.sqrt(r_lin*r_lin + g_lin*g_lin + b_lin*b_lin);// these make the diagram look better but break the rainbow in the invisible parts
//	const g_norm = g_lin/Math.sqrt(r_lin*r_lin + g_lin*g_lin + b_lin*b_lin);
//	const b_norm = b_lin/Math.sqrt(r_lin*r_lin + g_lin*g_lin + b_lin*b_lin);
	const r_unclamped = sRGB_gamma_correction(r_lin);
	const g_unclamped = sRGB_gamma_correction(g_lin);
	const b_unclamped = sRGB_gamma_correction(b_lin);
	const r = Math.max(0.0, Math.min(1.0, r_unclamped));
	const g = Math.max(0.0, Math.min(1.0, g_unclamped));
	const b = Math.max(0.0, Math.min(1.0, b_unclamped));
	return [r, g, b];
}
function RGB_to_rgb(R, G, B){
	const r = Math.round(R*255);
	const g = Math.round(G*255);
	const b = Math.round(B*255);
	return "rgb(" + r +"," + g + "," + b +")";
}
function XYZ_to_rgb(X,Y,Z){
//	return "color(xyz "+ X + " " + Y + " " + Z + ")";
	const [r,g,b] = XYZ_to_sRGB(X,Y,Z);
	return RGB_to_rgb(r,g,b);
}
function XYZ_to_rgb_n(X,Y,Z){ // normalized
	const x = X;
	const y = Y;
	const z = Z;
	const mx = Math.max(Math.max(x, y), z);
	return XYZ_to_rgb(x/mx,y/mx,z/mx);
}
function rgb_from_wavelength(lambda){
	return XYZ_to_rgb(x_bar(lambda), y_bar(lambda), z_bar(lambda));
}
function rgb_from_wavelength_n(lambda){ // normalized
	return XYZ_to_rgb_n(x_bar(lambda), y_bar(lambda), z_bar(lambda));
}
function make_rainbow_on_canvas(canvas_id, min_wavelength = 380, max_wavelength = 700){
	const canvas = document.getElementById(canvas_id);
	const ctx = canvas.getContext("2d");
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const grd = ctx.createLinearGradient(0, 0, width, 0);
	const range =  max_wavelength - min_wavelength;
	for(let i = 0; i <= range; i++){
		const wavelength = min_wavelength + i;
		grd.addColorStop(i/range, rgb_from_wavelength(wavelength));
	}
	ctx.fillStyle = grd;
	ctx.fillRect(0,0,width,height);
}

function make_XYZ_gradient_on_canvas(canvas_id, X1, Y1, Z1, X2, Y2, Z2, stopcount = 21){
	const canvas = document.getElementById(canvas_id);
	const ctx = canvas.getContext("2d");
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const grd = ctx.createLinearGradient(0, 0, width, 0);
	for(let i = 0; i <= 1; i += 1/(stopcount -1)){
		const X = X1*i + X2*(1-i);
		const Y = Y1*i + Y2*(1-i);
		const Z = Z1*i + Z2*(1-i);
		grd.addColorStop(i, XYZ_to_rgb(X, Y, Z) );
	}
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, width, height);
}

function make_XYZ_gradient_on_canvas_from_wavelength(canvas_id, lambda1, lambda2, stopcount = 21){
	make_XYZ_gradient_on_canvas(canvas_id, x_bar(lambda1), y_bar(lambda1), z_bar(lambda1), x_bar(lambda2), y_bar(lambda2), z_bar(lambda2), stopcount);
}

function draw_line_gradient(ctx, x0, y0, x1, y1, color1, color2){
	const grd = ctx.createLinearGradient(x0, y0, x1, y1);
	grd.addColorStop(0, color1);
	grd.addColorStop(1, color2);

	ctx.strokeStyle = grd;
	
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}

function draw_outline(ctx, x0, y0, x1, y1, wavelen_min, wavelen_max, wavelen_step_count, white_X, white_Y, white_Z, white_amount, n=true){
	var points =[]; // [xpos, ypos, color(css string)]
	const wavelen_step = (wavelen_max-wavelen_min)/wavelen_step_count;
	for(let wavelen=wavelen_min; wavelen < wavelen_max+wavelen_step; wavelen+=wavelen_step){
		if(wavelen > wavelen_max) wavelen = wavelen_max;
		const [Xpure, Ypure, Zpure] = XYZ_from_wavelength(wavelen);
		const X = Xpure*(1-white_amount) + white_X*white_amount;
		const Y = Ypure*(1-white_amount) + white_Y*white_amount;
		const Z = Zpure*(1-white_amount) + white_Z*white_amount;
		const x = X / (X+Y+Z);
		const y = Y / (X+Y+Z);
		const z = Z / (X+Y+Z);
		const color = n? XYZ_to_rgb_n(X,Y,Z) : XYZ_to_rgb(X,Y,Z);
		const xpos = x0*(1-x) + x1*x;
		const ypos = y0*(1-y) + y1*y;
		points.push([xpos, ypos, color]);
	}

	for(let i=1; i<points.length; i++){
		const point0 = points[i-1];
		const point1 = points[i];
		draw_line_gradient(ctx, point0[0], point0[1], point1[0], point1[1], point0[2], point1[2]);
	}
	// need to draw pink line in parts as the middle aproaches white so the color isn't mixed correctly by gradient fill
	const pink_line_step_count = 100;
	const [X_purple_pure, Y_purple_pure, Z_purple_pure] = XYZ_from_wavelength(wavelen_min);
	const [X_red_pure, Y_red_pure, Z_red_pure] = XYZ_from_wavelength(wavelen_max);
	const X_purple = X_purple_pure*(1-white_amount) + white_X*white_amount;
	const Y_purple = Y_purple_pure*(1-white_amount) + white_Y*white_amount;
	const Z_purple = Z_purple_pure*(1-white_amount) + white_Z*white_amount;
	const X_red = X_red_pure*(1-white_amount) + white_X*white_amount;
	const Y_red = Y_red_pure*(1-white_amount) + white_Y*white_amount;
	const Z_red = Z_red_pure*(1-white_amount) + white_Z*white_amount;
	for(let i=0; i<pink_line_step_count; i++){
		const k0 = i/pink_line_step_count;
		const k1 = (i+1)/pink_line_step_count;
		const X0 = X_purple*(1-k0) + X_red*k0;
		const Y0 = Y_purple*(1-k0) + Y_red*k0;
		const Z0 = Z_purple*(1-k0) + Z_red*k0;
		const X1 = X_purple*(1-k1) + X_red*k1;
		const Y1 = Y_purple*(1-k1) + Y_red*k1;
		const Z1 = Z_purple*(1-k1) + Z_red*k1;
		const C0 = n? XYZ_to_rgb_n(X0, Y0, Z0) : XYZ_to_rgb(X0, Y0, Z0);
		const C1 = n? XYZ_to_rgb_n(X1, Y1, Z1) : XYZ_to_rgb(X1, Y1, Z1);
		const x_0 = X0 / (X0+Y0+Z0);
		const y_0 = Y0 / (X0+Y0+Z0);
		const x_1 = X1 / (X1+Y1+Z1);
		const y_1 = Y1 / (X1+Y1+Z1);
		const xpos0 = x0*(1-x_0) + x1*x_0;
		const xpos1 = x0*(1-x_1) + x1*x_1;
		const ypos0 = y0*(1-y_0) + y1*y_0;
		const ypos1 = y0*(1-y_1) + y1*y_1;
		draw_line_gradient(ctx, xpos0, ypos0, xpos1, ypos1, C0, C1);
	}
}
function draw_graph(ctx, lw, x0, y0, x1, y1, wavelen_min, wavelen_max, wavelen_step_count, white_step_count, white_X, white_Y, white_Z, n=true){
	ctx.lineWidth = lw;
	for(let i = 0; i<white_step_count; i++){
		draw_outline(ctx, x0, y0, x1, y1, wavelen_min, wavelen_max, wavelen_step_count, white_X, white_Y, white_Z, i/white_step_count, n);
	}
}

function make_points_on_premade_cie1931_diagram(pointcount = 2){
	const svgns = "http://www.w3.org/2000/svg";
	const svgdocument = document.getElementById("diagram_cie1931_svg").contentDocument;
	const container = svgdocument.getElementsByTagName("svg").item(0);

	const children = container.childNodes;

	children.forEach(function (currentValue, currentIndex, listObj){
		while(currentValue && currentValue.nodeName == "circle"){
			container.removeChild(currentValue);
			currentValue = children[currentIndex];
		}
	});

	for(let i = 0; i<pointcount; i++){
		const circle = svgdocument.createElementNS(svgns, "circle");
		circle.setAttributeNS(null, 'id', i);
		circle.setAttributeNS(null, 'r', 5);
		circle.setAttributeNS(null, 'style', 'fill: none; stroke: black; stroke-width: 3;' );
		container.appendChild(circle);
	}

}

function draw_on_premade_cie1931_diagram(points){
	const svgns = "http://www.w3.org/2000/svg";
	const svgdocument = document.getElementById("diagram_cie1931_svg").contentDocument;
	const container = svgdocument.getElementsByTagName("svg").item(0);
	const border = svgdocument.getElementById("border")
	const border_length = border.getTotalLength();

	if(svgdocument.getElementById(0) == null){
		make_points_on_premade_cie1931_diagram(points.length);
	}

	var path = "M";
	var path_end = "";

	for(let i = 0; i<points.length; i++){
		const dist = points[i]*border_length;
		const point = border.getPointAtLength(dist);
		const circle = svgdocument.getElementById(i);
		circle.setAttributeNS(null, 'cx', point.x);
		circle.setAttributeNS(null, 'cy', point.y);
		path += " " + point.x + " " + point.y + " L";
		if(i == 0){
			path_end += point.x + " " + point.y;
		}
	}
	path += path_end;

	if(svgdocument.getElementById("gamut_outline") == null){
		const gamut = svgdocument.createElementNS(svgns, "path");
		gamut.setAttributeNS(null, 'id', "gamut_outline");
		gamut.setAttributeNS(null, 'style', "fill: none; stroke: black; stroke-width: 2;");
		container.appendChild(gamut);
	}

	const gmt = svgdocument.getElementById("gamut_outline");
	gmt.setAttributeNS(null, 'd', path);
}

function premade_cie1931_diagram_wavelength_to_distance_ratio(lambda){
//	return (lambda-380)/(700-380); // uncomment to add more points to values
	const values = [[380, 0], [410, 0.0017109375], [420, 0.002138671875], [440, 0.00712890625], [450, 0.01340234375], [460, 0.0228125], [465, 0.030359375], [470, 0.0425], [475, 0.060546875], [480, 0.0884375], [485, 0.1288025], [490, 0.1836755], [495, 0.2510675], [500, 0.3224375], [505, 0.388730625], [510, 0.44194675], [515, 0.4798518875], [520, 0.5040625], [525, 0.5267125], [530, 0.5524625], [535, 0.5779625], [540, 0.6040625], [545, 0.62996484375], [550, 0.6571759375], [555, 0.68493234375], [560, 0.713125], [580, 0.82375], [585, 0.849034375], [590, 0.873140625], [595, 0.8952984375], [600, 0.914375], [605, 0.93123625], [610, 0.945125], [615, 0.956579375], [620, 0.965625], [625, 0.9728359375], [630, 0.9789375], [635, 0.983596875], [640, 0.9878125], [650, 0.992796875], [660, 0.996421875], [680, 0.999125], [700, 1]];
	let x = 0;
	for(let i = 1; i<values.length; i++){
		if( lambda >= values[i-1][0] && lambda <= values[i][0] ){
			x = values[i-1][1] + ( values[i][1] - values[i-1][1] )*( (lambda - values[i-1][0])/(values[i][0] - values[i-1][0]) );
		}
	}
	return x;
}

function draw_on_premade_cie1931_diagram_from_wavelengths(points){
	draw_on_premade_cie1931_diagram(points.map(premade_cie1931_diagram_wavelength_to_distance_ratio).sort(function(a,b){ return a-b; }));
}








function make_points(count = 2){ // these are here to support multiple diagrams in the future (mainly the generated one)
	make_points_on_premade_cie1931_diagram(count);
}
function draw_points_from_wavelength(points){
	draw_on_premade_cie1931_diagram_from_wavelengths(points);
}

var selected_switch_index = 0;// initial index is 0 so points don't get created before user interaction (this is so create_points doesn't run before svg is loaded)

function toggle_gradient(){
	const checkbox = document.getElementById("grad");

	if(selected_switch_index > 0){
		checkbox.disabled = true;
		return;
	}

	checkbox.disabled = false;
}

function update_points(){
	const point_count = selected_switch_index + 2;
	const wavelengths = [];

	for(var i=0; i<point_count; i++){
		wavelengths.push(document.getElementById("ls"+i).value);
	}
	draw_points_from_wavelength(wavelengths);
}

function detect_change(){
	const radios = document.getElementsByName("switch");
	console.log(radios);
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked && selected_switch_index != i){
			selected_switch_index = i;
			make_points(i+2);
			update_points();
		}
	}

	toggle_gradient();
}

document.addEventListener("DOMContentLoaded", (event) => { detect_change(); });


















