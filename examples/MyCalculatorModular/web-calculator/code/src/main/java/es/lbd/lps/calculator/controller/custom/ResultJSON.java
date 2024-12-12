package es.lbd.lps.calculator.controller.custom;

public class ResultJSON {

	private float value = 0;

	public ResultJSON() {

	}

	public ResultJSON(float v) {

		this.value = v;
	}

	public float getValue() {

		return value;
	}

	public void setValue(float value) {

		this.value = value;
	}

}
