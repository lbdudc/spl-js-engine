package es.lbd.lps.calculator.controller.custom;

import javax.validation.constraints.NotNull;

public class RequestJSON {

	@NotNull
	private float first;
	@NotNull
	private float second;
	@NotNull
	private Operation operation;

	public RequestJSON() {

	}

	public float getFirst() {

		return first;
	}

	public void setFirst(float first) {

		this.first = first;
	}

	public float getSecond() {

		return second;
	}

	public void setSecond(float second) {

		this.second = second;
	}

	public Operation getOperation() {

		return operation;
	}

	public void setOperation(Operation operation) {

		this.operation = operation;
	}

}
