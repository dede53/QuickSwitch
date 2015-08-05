var bla = 
{
	Daniel:{
		'54':{
			name: 'Bett',
			room: 'Daniel',
			status: '1',
			deviceid: 54,
			buttonLabelOff: 'Aus',
			buttonLabelOn: 'An'
		},
		'55':{
			name: 'Bett',
			room: 'Daniel',
			status: '1',
			deviceid: 54,
			buttonLabelOff: 'Aus',
			buttonLabelOn: 'An'
		}
	},
	Wohnzimmer:{
		'54':{
			name: 'Bett',
			room: 'Daniel',
			status: '0',
			deviceid: 54,
			buttonLabelOff: 'Aus',
			buttonLabelOn: 'An'
		},
		'55':{
			name: 'Bett',
			room: 'Daniel',
			status: '0',
			deviceid: 54,
			buttonLabelOff: 'Aus',
			buttonLabelOn: 'An'
		}
	}
}

console.log(bla.Daniel);
bla.Daniel.forEach(function(dev){
	bla.Daniel[dev.deviceid].status = 0;
});
// bla.Daniel[54].status = 0;
// bla.Daniel[55].status = 0;
console.log(bla.Daniel);