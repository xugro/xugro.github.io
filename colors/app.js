// CIE 1931 color functions
function g(x, mu, tau_1, tau_2){
	if( x < mu){
		return Math.exp(-tau_1*tau_1* Math.pow(x-mu, 2)/2);
	}
	return Math.exp(-tau_2*tau_2* Math.pow(x-mu, 2)/2);
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
	const [r,g,b] = XYZ_to_sRGB(X,Y,Z);
	return RGB_to_rgb(r,g,b);
}
function rgb_from_wavelength(lambda){
	return XYZ_to_rgb(x_bar(lambda), y_bar(lambda), z_bar(lambda));
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


















