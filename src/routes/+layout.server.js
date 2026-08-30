export async function load({ locals }) {
	return {
		user: locals.user
			? { id: locals.user.id, email: locals.user.email, displayName: locals.user.displayName }
			: null,
		dbError: locals.dbError
	};
}
