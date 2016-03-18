/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import CKEditorError from '../../utils/ckeditorerror.js';

/**
 * The Batch class groups document changes (deltas). All deltas grouped in a single Batch can be
 * reverted together, so you can think about the Batch as a single undo step. If you want to extend one
 * undo step you can call another method on the same Batch object. If you want to create a separate undo step
 * you can create a new Batch.
 *
 * For example to create two separate undo steps you can call:
 *
 *		doc.batch().insert( firstPosition, 'foo' );
 *		doc.batch().insert( secondPosition, 'bar' );
 *
 * To create a single undo step:
 *
 *		const batch = doc.batch();
 *		batch.insert( firstPosition, 'foo' );
 *		batch.insert( secondPosition, 'bar' );
 *
 * Note that all document modification methods (insert, remove, split, etc.) are chainable so you can shorten code to:
 *
 *		doc.batch().insert( firstPosition, 'foo' ).insert( secondPosition, 'bar' );
 *
 * @memberOf core.treeModel
 */
export default class Batch {
	/**
	 * Creates Batch instance. Not recommended to use directly, use {@link core.treeModel.Document#batch} instead.
	 *
	 * @param {core.treeModel.Document} doc Document which this Batch changes.
	 */
	constructor( doc ) {
		/**
		 * Document which this Batch changes.
		 *
		 * @member {core.treeModel.Document} core.treeModel.Batch#doc
		 * @readonly
		 */
		this.doc = doc;

		/**
		 * Array of deltas which compose Batch.
		 *
		 * @member {Array.<core.treeModel.delta.Delta>} core.treeModel.Batch#deltas
		 * @readonly
		 */
		this.deltas = [];
	}

	/**
	 * Adds delta to the Batch instance. All modification methods (insert, remove, split, etc.) use this method
	 * to add created deltas.
	 *
	 * @param {core.treeModel.delta.Delta} delta Delta to add.
	 * @return {core.treeModel.delta.Delta} Added delta.
	 */
	addDelta( delta ) {
		delta.batch = this;
		this.deltas.push( delta );

		if ( this.deltas.length == 1 ) {
			this.doc.fire( 'batch', this );
		}

		return delta;
	}
}

/**
 * Function to register Batch methods. To make code scalable Batch do not have modification
 * methods built in. They can be registered using this method.
 *
 * This method checks if there is no naming collision and throws `batch-register-taken` if the method name
 * is already taken.
 *
 * Besides that no magic happens here, the method is added to the `Batch` class prototype.
 *
 * For example:
 *
 *		Batch.register( 'insert', function( position, nodes ) {
 *			// You can use a class inherit from Delta if that class should handle OT in the special way.
 *			const delta = new Delta();
 *
 *			// Create operations which should be components of this delta.
 *			const operation = new InsertOperation( position, nodes, this.doc.version );
 *
 *			// Add operation to the delta. It is important to add operation before applying it.
 *			delta.addOperation( operation );
 *
 *			// Remember to apply every operation, no magic, you need to do it manually.
 *			this.doc.applyOperation( operation );
 *
 *			// Add delta to the Batch instance.
 *			this.addDelta( delta );
 *
 *			// Make this method chainable.
 *			return this;
 *		} );
 *
 * @method core.treeModel.Batch.register
 * @param {String} name Method name.
 * @param {Function} creator Method body.
 */
export function register( name, creator ) {
	if ( Batch.prototype[ name ] ) {
		/**
		 * This batch method name is already taken.
		 *
		 * @error batch-register-taken
		 * @param {String} name
		 */
		throw new CKEditorError(
			'batch-register-taken: This batch method name is already taken.',
			{ name: name } );
	}

	Batch.prototype[ name ] = creator;
}
