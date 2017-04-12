import jsonschema from 'jsonschema';
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
/** @jsx h */
import Input from './input';
import { updateFormState } from '../actions/form-action.es';

class Form extends Component {
	constructor({dispatch, storeName,
					schema, init, ...props}) {
		super();
		this.schema = propSchema(schema, props);
		if (init) dispatch(updateFormState(storeName, init));
	}
	getChildContext() {
		let { schema } = this.props;
		return { schema, stateStore: this };
	}
	field(name, onChange) {
		let {dispatch, storeName, stateForm} = this.props;
		var value = stateForm[name];

		return {
			value: value,
			onChange(value) {
				dispatch(updateFormState(storeName, { [name]: value }));
				if (onChange) onChange(value);
			}
		};
	}
	result() {
		return this.schema.serialize(this.props.stateForm).instance;
	}
	render() {
		var {children, component, stateForm, schema, ...props} = this.props;
		if (schema.key !== this.schema.key)	this.schema = propSchema(schema, props);
		this.schema.serialize(stateForm); // hack: valid first state

		let Component = component || 'form';
		return (
			<Component result = {() => this.result()}
					   valid  = {() => this.schema.serialize(stateForm).valid} {...props}>
			  	{children}
			</Component>
		);
	}
}
const form = connect((store, ownProps ) => {
	let { storeName } = ownProps;
	return {
		stateForm: store[storeName].stateForm
	};
})(Form);

function Label({ labelPos, title, children }) {
	return (
		<label>{ title && labelPos != 'after' ? `${title}:` : '' }
		  {children}
		  { title && labelPos == 'after' ? title : '' }
		</label>
	);
}

class Field extends Component {
	render() {
		let { name, onChange, ...props } = this.props;
		let { schema, stateStore } = this.context;
		let desc = props.schema || schema.properties[name];

		return (
			<Label title={props.title || desc.title} >
				<Input name={name} schema={desc}
					   {...stateStore.field(name, onChange)} {...props}/>
			</Label>
		);
	}
}

const SelectOneOf = (props) => {
	const { title, name, schema, ...prop } = props;

	const selectDesc = {
		title: title,
		enum: [],
		enumNames: []
	};

	Object.keys(schema).forEach(item => {
		selectDesc.enum.push(item);
		selectDesc.enumNames.push(schema[item].title || item);
	});

	return <Field name={name} schema={selectDesc} {...prop}/>;
};

////

function propSchema(schema, { customValid, serialize = {}, deserialize = {} }) {
	var v = new jsonschema.Validator();
	if (customValid) {
		schema = Object.assign({}, schema); // copy
		schema.properties = Object.keys(customValid).reduce((res, prop) => {
			v.customFormats[prop] = customValid[prop];
			res[prop] = { format: prop, ...res[prop] };
			return res;
		}, schema.properties);
	}
	return {
		key: schema.key || '',
		serialize: inst => v.validate(inst, schema, {
			rewrite: serializeRewrite.bind(null, serialize)
		}),
		deserialize: inst => v.validate(inst, schema, {
			rewrite: deserializeRewrite.bind(null, deserialize)
		})
	};
}

function serializeRewrite(serializeMap, instance, schema) {
	var res = {};
	if (typeof instance != 'object' || !schema.properties) {
		return instance !== undefined ? instance :
			schema.default;
	}

	for (var p in schema.properties) {
		if (p in instance) {
			res[p] = instance[p];
		}
	}
	return res;
}

function deserializeRewrite(deserializeMap, instance, schema) {
	return instance;
}

function constant(schema, prop) {
	let desc = schema.properties[prop];
	return desc.constant || desc.enum[0]; // see https://git.io/v6hyP
}

function mapOf(schema, prop) {
	console.assert(schema.oneOf);
	return schema.oneOf.reduce((res, desc) => {
		res[constant(desc, prop)] = desc;
		return res;
	}, {});
}

function selectListOf(schema, prop) {
	let desc = schema.properties && schema.properties[prop];
	if (desc)
		return desc.enum.map((value, i) => {
			let title = desc.enumNames && desc.enumNames[i];
			return title ? { title, value } : value;
		});
	return schema.oneOf.map(desc => (
		!desc.title ? constant(desc, prop) : {
			title: desc.title,
			value: constant(desc, prop)
		}
	));
}

export { form, Field, SelectOneOf, mapOf };