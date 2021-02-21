function displayMetadata() {
	const snippeds = document.querySelectorAll('script[type="application/ld+json"]');

	const linkProps = [
		"acceptsReservations",
		"acquireLicensePage",
		"actionPlatform",
		"actionableFeedbackPolicy",
		"additionalType",
		"afterMedia",
		"applicationCategory",
		"applicationSubCategory",
		"artMedium",
		"artform",
		"artworkSurface",
		"bankAccountType",
		"beforeMedia",
		"benefitsSummaryUrl",
		"bodyType",
		"category",
		"codeRepository",
		"colleague",
		"competencyRequired",
		"contentUrl",
		"correction",
		"correctionsPolicy",
		"courseMode",
		"credentialCategory",
		"discussionUrl",
		"diseasePreventionInfo",
		"diseaseSpreadStatistics",
		"diversityPolicy",
		"diversityStaffingReport",
		"documentation",
		"downloadUrl",
		"duringMedia",
		"editEIDR",
		"educationalCredentialAwarded",
		"educationalLevel",
		"educationalProgramMode",
		"embedUrl",
		"encodingFormat",
		"engineType",
		"ethicsPolicy",
		"featureList",
		"feesAndCommissionsSpecification",
		"fileFormat",
		"fuelType",
		"gameLocation",
		"gamePlatform",
		"genre",
		"gettingTestedInfo",
		"hasMap",
		"hasMenu",
		"healthPlanMarketingUrl",
		"identifier",
		"image",
		"inCodeSet",
		"inDefinedTermSet",
		"installUrl",
		"isBasedOn",
		"isBasedOnUrl",
		"isPartOf",
		"keywords",
		"knowsAbout",
		"labelDetails",
		"layoutImage",
		"legislationIdentifier",
		"license",
		"loanType",
		"logo",
		"mainEntityOfPage",
		"map",
		"maps",
		"masthead",
		"material",
		"measurementTechnique",
		"meetsEmissionStandard",
		"memoryRequirements",
		"menu",
		"merchantReturnLink",
		"missionCoveragePrioritiesPolicy",
		"namedPosition",
		"newsUpdatesAndGuidelines",
		"noBylinesPolicy",
		"occupationalCredentialAwarded",
		"ownershipFundingInfo",
		"paymentUrl",
		"physicalRequirement",
		"prescribingInfo",
		"productReturnLink",
		"propertyID",
		"publicTransportClosuresInfo",
		"publishingPrinciples",
		"quarantineGuidelines",
		"relatedLink",
		"releaseNotes",
		"replyToUrl",
		"requirements",
		"roleName",
		"sameAs",
		"schemaVersion",
		"schoolClosuresInfo",
		"screenshot",
		"sdLicense",
		"season",
		"securityClearanceRequirement",
		"sensoryRequirement",
		"serviceUrl",
		"shippingSettingsLink",
		"significantLink",
		"significantLinks",
		"softwareRequirements",
		"speakable",
		"sport",
		"storageRequirements",
		"surface",
		"targetUrl",
		"temporalCoverage",
		"termsOfService",
		"thumbnailUrl",
		"ticketToken",
		"titleEIDR",
		"tourBookingPage",
		"trackingUrl",
		"travelBans",
		"unitCode",
		"unnamedSourcesPolicy",
		"url",
		"usageInfo",
		"usesHealthPlanIdStandard",
		"vehicleTransmission",
		"verificationFactCheckingPolicy",
		"warning",
		"webFeed",
	];

	for (let snipped of snippeds) {
		let json = JSON.parse(snipped.innerText);
		let container = document.createElement('details');
		container.style.padding = '1em';
		container.style.border = '1px solid';
		let summary = document.createElement('summary');
		summary.innerText = 'Metadata';
		summary.style.fontWeight = 'bold';
		summary.style.cursor = 'pointer';
		let lines = JSON.stringify(json, null, 2).split('\n');
		for (let line of lines) {
			let code = document.createElement('pre');
			code.style.margin = '0';
			let m = line.match(`(\\s+)"(${linkProps.join('|')})": "([^" ]+)"`);
			if (m) {
				let linestart = `${m[1]}"${m[2]}": `;
				let link = document.createElement('a');
				link.setAttribute('href', m[3]);
				link.innerText = `"${m[3]}"`;
				code.innerText = linestart;
				code.appendChild(link);
			} else {
				code.innerText = line;
			}
			container.appendChild(code);
		}
		container.appendChild(summary);

		let isInHead = snipped.closest('head');
		if (isInHead) {
			document.body.prepend(container);
		} else {
			snipped.parentNode.insertBefore(container, snipped.nextSibling);
		}
	}
}

export { displayMetadata }