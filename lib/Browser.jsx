import React, { Component } from 'react'
import PropTypes from 'prop-types'
 

class Purchase extends Component {
	render() {
		return (
			<div className='purchase wrapper'>
				<div className="sub-area title">
					<span>Upgrade for <strong>{this.props.match.params.moduleName}</strong> module.</span>
				</div>

				<div className="sub-area feature">
					<ul>
						<li>
							<strong><Translate text="FEATURES" /></strong>
						</li>
						<li>
							lorem-ispum 1
						</li>
						<li>
							lorem-ispum 2 lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum lorem-ispum
						</li>
					</ul>
				</div>

				<div className="sub-area video">
					<strong><Translate text="YOUTUBE" /></strong>
					<iframe width="560" height="315" src="https://www.youtube.com/embed/P5cYXlf_Ffo" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
				</div>
				<div className="sub-area description">
					<strong>Description:</strong> <p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam efficitur efficitur sem ac hendrerit. Quisque consectetur ac augue in aliquet. Cras ultrices porttitor nibh, id commodo nulla elementum in. Morbi sit amet tempor ipsum. Quisque ut finibus eros, vitae porttitor erat. Curabitur sit amet tellus fringilla, ultricies sapien in, feugiat massa. Proin suscipit maximus nunc et pellentesque. Etiam eu porttitor mauris.

						Maecenas porttitor elementum tortor, at auctor quam fringilla vulputate. Cras aliquet consectetur tincidunt. Morbi semper mauris finibus fringilla tincidunt. Donec in magna libero. Suspendisse nec augue sed ipsum tristique imperdiet non vel massa. Sed lobortis, sapien vitae tempor tincidunt, tortor ligula vehicula sem, at pretium elit enim sed justo. Maecenas at metus ornare, molestie nunc vel, gravida lorem. Integer quis leo elit. Vivamus vitae commodo libero. Curabitur sed felis dapibus, semper tellus vel, posuere est. Mauris a est convallis, mattis lacus vitae, mollis libero. Vestibulum varius arcu a venenatis placerat. Sed congue ut tortor quis gravida. Nam lacinia lectus non felis eleifend lobortis. Duis finibus pulvinar metus, in malesuada orci maximus ut. Curabitur porta augue mauris, sit amet viverra justo sodales id.
					</p>
					<button className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
						<Translate text="PURCHASE_NOW" />
					</button>
				</div>
				<div className="bottom-content">asdasd</div>
			</div>
		)
	}
}

Purchase.propTypes = {
	match: PropTypes.object,
	data: PropTypes.object
}

export default Purchase
