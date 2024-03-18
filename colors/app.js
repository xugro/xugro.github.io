// CIE 1931 color space is used
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
	return 0.821*g(lambda, 568.8, 0.0213, 0.0247) + 0.268*g(lambda, 530.9, 0.0613, 0.0322);
}
function z_bar(lambda){
	return 1.217*g(lambda, 437.0, 0.0845, 0.0278) + 0.681*g(lambda, 549.0, 0.0385, 0.0725);
}
