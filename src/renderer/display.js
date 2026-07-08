const mainArea = document.querySelector('main');

function escapeHtml(str) {
	return String(str || '').replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function createContent(verse) {
	const container = document.createElement('div');
	container.className = 'verse-content';

	const ref = document.createElement('div');
	ref.className = 'reference';
	ref.innerHTML = escapeHtml(verse.reference || '');

	const txt = document.createElement('div');
	txt.className = 'text';
	txt.innerHTML = escapeHtml(verse.text || '').replace(/\n/g, '<br>');

	container.appendChild(ref);
	container.appendChild(txt);
	return { container, refEl: ref, textEl: txt };
}

function fits(container) {
	// Check whether container fits within viewport without overflow
	const rect = container.getBoundingClientRect();
	return rect.width <= window.innerWidth - 1 && rect.height <= window.innerHeight - 1;
}

function autoScale(textEl, containerEl) {
	// binary search font-size in px between max and min
	const max = Math.min(window.innerHeight * 0.12, 220); // upper bound
	const min = 18;
	let low = min;
	let high = max;
	let best = min;

	// apply same font-size to both reference and text container by scaling root
	const textNode = textEl;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		textNode.style.fontSize = mid + 'px';
		// also adjust reference smaller relative to text
		const ref = containerEl.querySelector('.reference');
		if (ref) ref.style.fontSize = Math.max(12, Math.floor(mid * 0.5)) + 'px';

		// allow browser to render measurement
		// small throttle not needed in sync here
		const overflows = textNode.scrollHeight > containerEl.clientHeight || textNode.scrollWidth > containerEl.clientWidth;
		const totalHeight = containerEl.scrollHeight;

		if (!overflows && totalHeight <= containerEl.clientHeight) {
			best = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}

	// set best size
	textNode.style.fontSize = best + 'px';
	const ref = containerEl.querySelector('.reference');
	if (ref) ref.style.fontSize = Math.max(12, Math.floor(best * 0.5)) + 'px';
}

async function renderVerse(verse) {
	if (!verse) return;

	const { container, refEl, textEl } = createContent(verse);

	// place offscreen to measure
	container.style.opacity = '0';
	mainArea.appendChild(container);

	// ensure container fills available area for measurement
	container.style.maxWidth = '90vw';
	container.style.boxSizing = 'border-box';
	container.style.display = 'block';

	// autoscale text to try to fit on one screen
	autoScale(textEl, container);

	// fade-in transition: remove any existing .verse-content.show, then add new
	const previous = mainArea.querySelector('.verse-content.show');
	if (previous) {
		previous.classList.remove('show');
		// remove after transition
		setTimeout(() => {
			try { previous.remove(); } catch (_) {}
		}, 260);
	}

	// force reflow then show
	// small delay to allow measurement and transition
	requestAnimationFrame(() => {
		container.classList.add('show');
	});
}

// Toggle fullscreen on double click
mainArea.addEventListener('dblclick', async () => {
	try {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	} catch (_) {}
});

if (window.displayAPI && typeof window.displayAPI.onVerse === 'function') {
	window.displayAPI.onVerse((data) => {
		renderVerse(data);
	});
}