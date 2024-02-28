import { encodeBase64 } from 'https://deno.land/std@0.217.0/encoding/base64.ts';
import { ensureDir } from 'https://deno.land/std@0.107.0/fs/mod.ts';

import { createCanvas } from 'https://deno.land/x/canvas@v1.4.1/mod.ts';
import * as uuid7 from 'https://deno.land/x/uuid7@v0.0.1/mod.ts';
import { blob } from 'https://esm.town/v/std/blob?v=3';
const isLocal = Deno.env.get('IS_LOCAL');

function RGBToHSL(rgb: string) {
	rgb = rgb.replace('#', '');
	const r = parseInt(rgb.substring(0, 2), 16) / 255;
	const g = parseInt(rgb.substring(2, 4), 16) / 255;
	const b = parseInt(rgb.substring(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	s = s * 100;
	s = Math.round(s);
	l = l * 100;
	l = Math.round(l);
	h = Math.round(360 * h);

	return [h, s, l];
}

function generateRandomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

export async function handler(req: Request) {
	let color = generateRandomColor();
	if (req.method === 'POST') {
		const json = await req.json();
		console.log(json);
		if (Object.hasOwn(json, 'color')) {
			color = json.color;
		}
	}
	const canvas = createCanvas(200, 150);
	const ctx = canvas.getContext('2d');

	const width = 100;
	const height = 100;
	const bg = 'hsl(360,0%,10%)';
	const hsl = RGBToHSL(color);
	const hue = hsl[0];
	const sat = hsl[1];
	const lig = hsl[2];
	const complementaryColor = 'hsl(' + ((hue + 180) % 360) + ',' + sat + '%,' +
		lig +
		'%)';

	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = bg;
	for (let i = 0; i < 100; i++) {
		if (i % 2) {
			ctx.fillStyle = color;
		} else {
			ctx.fillStyle = complementaryColor;
		}
		const randX = (1 / Math.sqrt(Math.random())) * 50 - width / 2;
		const randY = Math.random() * height + 5;
		const randRadius = Math.random() * 4;
		ctx.beginPath();
		ctx.arc(randX, randY, randRadius, 0, 2 * Math.PI);
		ctx.fill();
	}
	const buf = canvas.toBuffer();
	const filename = uuid7.v7();
	if (isLocal) {
		await ensureDir('images');
		Deno.writeFile(`images/${filename}.png`, buf);
	} else {
		await blob.set(`img_${filename}`, buf);
	}

	const img = encodeBase64(buf);

	return new Response(`<img src="data:image/png;base64,${img}" />`, {
		headers: {
			'Content-Type': 'text/html',
		},
	});
}

if (isLocal) {
	Deno.serve(handler);
}
