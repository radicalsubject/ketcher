import { h, Component } from 'preact';
/** @jsx h */

import Dialog from '../component/dialog';
import Tabs from '../component/tabs';
import { form as Form, Field } from '../component/form';

const checkSchema = {
	title: 'Check',
	type: 'object',
	properties: {
		valence: {
			title: 'Valence',
			type: 'boolean'
		},
		radicals: {
			title: 'Radical',
			type: 'boolean'
		},
		pseudoatoms: {
			title: 'Pseudoatom',
			type: 'boolean'
		},
		stereo: {
			title: 'Stereochemistry',
			type: 'boolean'
		},
		query: {
			title: 'Query',
			type: 'boolean'
		},
		overlapping_atoms: {
			title: 'Overlapping Atoms',
			type: 'boolean'
		},
		overlapping_bonds: {
			title: 'Overlapping Bonds',
			type: 'boolean'
		},
		rgroups: {
			title: 'R-Groups',
			type: 'boolean'
		},
		chiral: {
			title: 'Chirality',
			type: 'boolean'
		},
		'3d': {
			title: '3D Structure',
			type: 'boolean'
		}
	}
};

function Check(props) {
	const tabs = ['Check', 'Settings'];
	let { check, ...prop } = props;

	return (
		<Form storeName="check" component={Dialog} title="Structure Check" className="check"
			  schema={checkSchema} params={prop}>
			<Tabs className="tabs" captions={tabs}>
				<ErrorsCheck className="result" check={check}/>
				<ul className="settings">  {
					Object.keys(checkSchema.properties).map(type => (
						<li><Field name={type}/></li>
					))
				}</ul>
			</Tabs>
		</Form>
	);
}

class ErrorsCheck extends Component {
	constructor(props, { stateStore }) {
		super(props);
		let { stateForm } = stateStore.props;
		let optsTypes = Object.keys(stateForm).filter((type) => stateForm[type]);

		this.state = {
			moleculeErrors: {}
		};

		this.checkMolecule(optsTypes)
	}

	checkMolecule(optsTypes) {
		this.props.check({ 'types': optsTypes })
			.then(res => this.setState({ moleculeErrors: res }))
			.catch(console.error);
	}

	render(props) {
		let { moleculeErrors } = this.state;
		let moleculeErrorsTypes = Object.keys(moleculeErrors);
		return (
			<dl {...props}>
				{moleculeErrorsTypes.length === 0 ?
					<li>
						<div className="error-name">No errors found</div>
					</li> :
					moleculeErrorsTypes.map((type) => (
						<div>
							<dt>{checkSchema.properties[type].title} error :</dt>
							<dd>{moleculeErrors[type]}</dd>
						</div>
					))}
			</dl>
		);
	}
}

export default Check;
